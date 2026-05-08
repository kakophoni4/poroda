import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { normalizeOrderStatus } from "@/lib/order-status";
import { createReviewInviteNotification } from "@/lib/review-invite";

const TARGET_STATUSES = new Set(["paid", "unpaid", "refunded"]);

const ORDER_ADMIN_INCLUDE = {
  items: { include: { product: { select: { slug: true, title: true } } } },
  user: { select: { id: true, email: true, name: true } },
} as const;

type PaymentTarget = "paid" | "unpaid" | "refunded";

/**
 * Смена paymentStatus из админки. Учёт промо при `paid` — только для online-заказов
 * (on_delivery: счёт и PromoUse при оформлении; кнопка «оплачено» дублирует только дату/статус).
 * Откат usedCount / PromoUse при снятии `paid` — тоже только online (на привозе промо не привязано
 * к тому, что в админке нажали «оплачено»).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: orderId } = await params;
  const body = (await request.json()) as { paymentStatus?: unknown };
  if (typeof body.paymentStatus !== "string" || !TARGET_STATUSES.has(body.paymentStatus)) {
    return NextResponse.json(
      { error: "Некорректный paymentStatus: paid | unpaid | refunded" },
      { status: 400 }
    );
  }
  const to: PaymentTarget = body.paymentStatus as PaymentTarget;
  const now = new Date();

  try {
    const { order, reviewInviteSnap } = await prisma.$transaction(async (tx) => {
      type Snap = { userId: string | null; email: string; reviewToken: string | null };
      let reviewSnap: Snap | null = null;
      const before = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          paymentStatus: true,
          paymentMethod: true,
          promoId: true,
          userId: true,
          status: true,
          reviewToken: true,
          email: true,
        },
      });
      if (!before) return { order: null, reviewInviteSnap: null as Snap | null };

      const from = before.paymentStatus;
      if (from === to) {
        const o = await tx.order.findUnique({
          where: { id: orderId },
          include: ORDER_ADMIN_INCLUDE,
        });
        return { order: o, reviewInviteSnap: null as Snap | null };
      }

      const online = before.paymentMethod === "online";

      if (to === "paid") {
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "paid", paymentCheckedAt: now },
        });
        if (before.promoId && online) {
          const useExists = await tx.promoUse.findFirst({
            where: { promoId: before.promoId, orderId: orderId },
          });
          if (!useExists) {
            if (before.userId) {
              await tx.promoUse.create({
                data: { promoId: before.promoId, userId: before.userId, orderId: orderId },
              });
            }
            const after = await tx.promo.update({
              where: { id: before.promoId },
              data: { usedCount: { increment: 1 } },
              select: { usedCount: true, maxUses: true, code: true },
            });
            if (after.maxUses != null && after.usedCount > after.maxUses) {
              console.warn(
                `[admin/orders/payment] usedCount > maxUses for promo ${after.code} (order ${orderId.slice(0, 8)}…), order remains paid.`
              );
            }
          }
        }
        if (before.userId) {
          await tx.userNotification.create({
            data: {
              userId: before.userId,
              title: "Оплата получена",
              body: "Оплата получена",
            },
          });
        }
      } else {
        if (from === "paid" && online && before.promoId) {
          const useRow = await tx.promoUse.findFirst({
            where: { promoId: before.promoId, orderId: orderId },
          });
          if (useRow) {
            await tx.promoUse.delete({ where: { id: useRow.id } });
          }
          await tx.promo.update({
            where: { id: before.promoId, usedCount: { gt: 0 } },
            data: { usedCount: { decrement: 1 } },
          });
        }
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: to,
            paymentCheckedAt: to === "unpaid" ? null : now,
          },
        });
      }

      await tx.paymentEvent.create({
        data: {
          orderId: orderId,
          paymentId: null,
          rawPayload: { type: "manual_admin_change", by: session.adminId, from, to },
          signatureValid: true,
          status: "manual_admin_change",
        },
      });

      /* До возврата: если только что перевели online-заказ в paid и он уже был доставлен — внешний код создаст invite. */
      if (to === "paid" && from !== "paid" && before.paymentMethod === "online") {
        if (normalizeOrderStatus(before.status) === "delivered" && (before.userId || (before.email?.trim() ?? "") !== "")) {
          reviewSnap = {
            userId: before.userId,
            email: before.email,
            reviewToken: before.reviewToken,
          };
        }
      }

      const o = await tx.order.findUnique({
        where: { id: orderId },
        include: ORDER_ADMIN_INCLUDE,
      });
      return { order: o, reviewInviteSnap: reviewSnap };
    });

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (reviewInviteSnap) {
      await createReviewInviteNotification(
        {
          id: orderId,
          userId: reviewInviteSnap.userId,
          email: reviewInviteSnap.email,
          reviewToken: reviewInviteSnap.reviewToken,
        },
        { reason: "admin-payment-paid-delivered" }
      );
    }

    return NextResponse.json(order);
  } catch (e) {
    console.error("admin/orders/payment:", e);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}

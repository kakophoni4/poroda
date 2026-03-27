import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyPromoToTotal } from "@/lib/apply-promo";
import { getAdminSession, getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orderStatusLabel } from "@/lib/order-status";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const adminSession = await getAdminSession();
  if (adminSession) {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { slug: true, title: true } } } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    return NextResponse.json(orders);
  }
  const userSession = await getUserSession();
  if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: userSession.userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { slug: true } } } },
      review: { select: { id: true, status: true } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, name, address, items, promoCode, total } = body as {
      email: string;
      phone: string;
      name: string;
      address: string;
      items: { productId: string; title: string; price: number; quantity: number }[];
      promoCode?: string;
      total: number;
    };
    if (!email || !phone || !name || !address || !items?.length || total == null) {
      return NextResponse.json({ error: "Не заполнены обязательные поля" }, { status: 400 });
    }
    const emailNorm = email.trim().toLowerCase();
    const userSession = await getUserSession();
    /** Заказ крепим к аккаунту только если email в форме совпадает с email профиля (иначе — «гость», даже при открытой сессии). */
    let orderUserId: string | null = null;
    if (userSession?.userId) {
      const account = await prisma.user.findUnique({
        where: { id: userSession.userId },
        select: { email: true },
      });
      if (account?.email.trim().toLowerCase() === emailNorm) {
        orderUserId = userSession.userId;
      }
    }
    let finalTotal = total;
    let promoId: string | null = null;
    if (promoCode) {
      const promo = await prisma.promo.findFirst({
        where: { code: promoCode.toUpperCase().trim(), active: true },
      });
      if (promo) {
        const applied = applyPromoToTotal(total, promo);
        if (applied.ok) {
          finalTotal = applied.finalTotal;
          promoId = promo.id;
        }
      }
    }
    const order = await prisma.order.create({
      data: {
        userId: orderUserId,
        email: emailNorm,
        phone,
        name,
        address,
        status: "placed",
        promoCode: promoCode || null,
        promoId,
        total: finalTotal,
        reviewToken: randomBytes(24).toString("hex"),
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });
    if (promoId) {
      await prisma.promo.update({
        where: { id: promoId },
        data: { usedCount: { increment: 1 } },
      });
      if (orderUserId) {
        await prisma.promoUse.create({
          data: { promoId, userId: orderUserId, orderId: order.id },
        });
      }
    }
    if (order.userId) {
      await prisma.userNotification.create({
        data: {
          userId: order.userId,
          title: "Заказ оформлен",
          body: `Заказ ${order.id.slice(0, 10)}… принят. Сумма ${finalTotal.toLocaleString("ru-RU")} ₽. Статус: ${orderStatusLabel("placed")}.`,
        },
      });
    }
    return NextResponse.json({ order, orderNumber: order.id });
  } catch (e) {
    console.error("Order create error:", e);
    return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 });
  }
}

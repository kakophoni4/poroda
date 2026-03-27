import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findOrderForReviewAccess } from "@/lib/review-order-access";
import { normalizeOrderStatus, orderStatusLabel } from "@/lib/order-status";

/** Статус отзыва по заказу; доступ по секретному token или по сессии владельца заказа */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  const token = url.searchParams.get("token")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "Нужен orderId" }, { status: 400 });
  }
  const session = await getUserSession();
  try {
    const order = await findOrderForReviewAccess(orderId, { token: token || null, userId: session?.userId });
    if (!order) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    const statusNorm = normalizeOrderStatus(order.status);
    const review = await prisma.customerReview.findUnique({
      where: { orderId: order.id },
      select: { status: true, rewardCode: true },
    });
    const hasReview = !!review;
    const canReview = statusNorm === "delivered" && !hasReview;
    if (!review) {
      return NextResponse.json({
        hasReview: false,
        status: null as string | null,
        rewardCode: null as string | null,
        orderStatus: order.status,
        orderStatusLabel: orderStatusLabel(order.status),
        canReview,
      });
    }
    return NextResponse.json({
      hasReview: true,
      status: review.status,
      rewardCode: review.status === "approved" ? review.rewardCode ?? null : null,
      orderStatus: order.status,
      orderStatusLabel: orderStatusLabel(order.status),
      canReview: false,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

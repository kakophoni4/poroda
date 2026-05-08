import { prisma } from "@/lib/db";
import { normalizeOrderStatus } from "@/lib/order-status";

/**
 * @returns сообщение с причиной отказа или null, если оставить отзыв / грузить фото можно
 */
export function getOrderReviewIneligibilityMessage(order: {
  paymentStatus: string;
  paymentMethod: string;
  status: string;
}): string | null {
  if (order.paymentStatus !== "paid") {
    return "Отзыв доступен после подтверждения оплаты.";
  }
  if (order.paymentMethod === "on_delivery" && normalizeOrderStatus(order.status) !== "delivered") {
    return "Отзыв можно оставить после доставки заказа.";
  }
  return null;
}

export async function findOrderForReviewAccess(
  orderId: string,
  opts: { token?: string | null; userId?: string | null }
) {
  const id = orderId.trim();
  if (!id) return null;
  const t = opts.token?.trim();
  if (t) {
    return prisma.order.findFirst({ where: { id, reviewToken: t } });
  }
  const uid = opts.userId?.trim();
  if (uid) {
    return prisma.order.findFirst({ where: { id, userId: uid } });
  }
  return null;
}

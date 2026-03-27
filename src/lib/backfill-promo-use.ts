import { prisma } from "@/lib/db";

/** Создаёт недостающие PromoUse для заказов пользователя с промо (например после гостевого чекаута и привязки аккаунта). usedCount у промо не трогаем. */
export async function backfillPromoUseForUser(userId: string): Promise<void> {
  const orders = await prisma.order.findMany({
    where: { userId, promoId: { not: null } },
    select: { id: true, promoId: true },
  });
  for (const o of orders) {
    if (!o.promoId) continue;
    const exists = await prisma.promoUse.findFirst({ where: { orderId: o.id } });
    if (exists) continue;
    await prisma.promoUse.create({
      data: { userId, promoId: o.promoId, orderId: o.id },
    });
  }
}

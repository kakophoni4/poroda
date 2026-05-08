import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

const PREFIX = "THANKS-";
const MINT_MAX_ATTEMPTS = 32;

type DbPromoNotify = Pick<PrismaClient, "promo" | "userNotification">;

/**
 * Создаёт персональный промо за отправленный отзыв: −10%, одно применение, 90 суток.
 * PromoUse не создаётся — квота списывается при оформлении заказа с кодом.
 * В `$transaction` передайте `tx` вместо дефолтного `prisma`, чтобы награда и отзыв ушли в одной транзакции.
 */
export async function createReviewRewardForOrder(
  orderId: string,
  userId: string | null,
  db: DbPromoNotify = prisma
): Promise<{ code: string }> {
  const validTo = new Date();
  validTo.setDate(validTo.getDate() + 90);

  for (let a = 0; a < MINT_MAX_ATTEMPTS; a++) {
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const code = `${PREFIX}${suffix}`;
    const taken = await db.promo.findUnique({ where: { code } });
    if (taken) continue;
    await db.promo.create({
      data: {
        code,
        percent: 10,
        maxUses: 1,
        usedCount: 0,
        validTo,
        active: true,
        description: `Скидка 10% за отзыв (заказ ${orderId.slice(0, 8)}…)`,
      },
    });
    if (userId) {
      await db.userNotification.create({
        data: {
          userId,
          title: "Промокод за отзыв",
          body: `Ваш код на скидку 10%: ${code}. Срок действия — 90 дней, одно применение.`,
        },
      });
    }
    return { code };
  }

  const code = `${PREFIX}${randomBytes(3).toString("hex").toUpperCase()}`;
  await db.promo.create({
    data: {
      code,
      percent: 10,
      maxUses: 1,
      usedCount: 0,
      validTo,
      active: true,
      description: `Скидка 10% за отзыв (заказ ${orderId.slice(0, 8)}…, резерв)`,
    },
  });
  if (userId) {
    await db.userNotification.create({
      data: {
        userId,
        title: "Промокод за отзыв",
        body: `Ваш код на скидку 10%: ${code}. Срок действия — 90 дней, одно применение.`,
      },
    });
  }
  return { code };
}

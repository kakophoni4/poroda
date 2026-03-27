import type { Promo } from "@prisma/client";

export type PromoForApply = Pick<
  Promo,
  "percent" | "discountRub" | "maxUses" | "usedCount" | "validFrom" | "validTo" | "active"
>;

/** Проверка срока и лимита использований + расчёт итога заказа */
export function applyPromoToTotal(
  total: number,
  promo: PromoForApply
): { ok: true; finalTotal: number } | { ok: false; reason: string } {
  if (!promo.active) return { ok: false, reason: "Промокод неактивен" };
  const now = new Date();
  if (promo.validFrom && promo.validFrom > now) return { ok: false, reason: "Промокод ещё не действует" };
  if (promo.validTo && promo.validTo < now) return { ok: false, reason: "Срок действия промокода истёк" };
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return { ok: false, reason: "Промокод уже использован" };

  const rub = promo.discountRub ?? 0;
  if (rub > 0) {
    return { ok: true, finalTotal: Math.max(0, total - rub) };
  }
  if (promo.percent <= 0) return { ok: false, reason: "Некорректный промокод" };
  return { ok: true, finalTotal: Math.round(total * (1 - promo.percent / 100)) };
}

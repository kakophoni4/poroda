import type { Prisma } from "@prisma/client";

type PromoForFilter = { id: string; code: string };

/** Фильтр заказов по промо из `?promo=`: id промо, `__none__` — без промо, пусто — все. */
export function buildOrderPromoWhere(
  promo: string | undefined,
  promos: PromoForFilter[]
): Prisma.OrderWhereInput | undefined {
  if (promo == null || promo === "") return undefined;
  if (promo === "__none__") {
    return {
      AND: [
        { OR: [{ promoId: null }, { promoId: "" }] },
        { OR: [{ promoCode: null }, { promoCode: "" }] },
      ],
    };
  }
  const byId = new Map(promos.map((p) => [p.id, p] as const));
  if (!byId.has(promo)) return undefined;
  const code = byId.get(promo)!.code.toUpperCase();
  return {
    OR: [
      { promoId: promo },
      { promoCode: { equals: code, mode: "insensitive" } },
    ],
  };
}

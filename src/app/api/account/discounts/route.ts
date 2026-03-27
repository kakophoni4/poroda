import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { backfillPromoUseForUser } from "@/lib/backfill-promo-use";

function promoStillUsable(p: {
  maxUses: number | null;
  usedCount: number;
  validFrom: Date | null;
  validTo: Date | null;
  active: boolean;
}) {
  if (!p.active) return false;
  const now = new Date();
  if (p.validFrom && p.validFrom > now) return false;
  if (p.validTo && p.validTo < now) return false;
  if (p.maxUses != null && p.usedCount >= p.maxUses) return false;
  return true;
}

function formatPromoLine(p: { percent: number; discountRub: number | null }) {
  if (p.discountRub && p.discountRub > 0) return `−${p.discountRub.toLocaleString("ru-RU")} ₽`;
  return `−${p.percent}%`;
}

/** Единый список: сначала использованные (по заказам), затем доступные промокоды */
export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.userId;

  await backfillPromoUseForUser(userId);

  const [ordersWithPromo, reviewRows, activePromos] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId,
        OR: [{ promoId: { not: null } }, { promoCode: { not: null } }],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerReview.findMany({
      where: {
        status: "approved",
        rewardCode: { not: null },
        order: { userId },
      },
      select: { rewardCode: true },
    }),
    prisma.promo.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        code: true,
        percent: true,
        discountRub: true,
        description: true,
        maxUses: true,
        usedCount: true,
        validFrom: true,
        validTo: true,
        active: true,
      },
    }),
  ]);

  const promoIds = [...new Set(ordersWithPromo.map((o) => o.promoId).filter((id): id is string => id != null))];
  const promosById =
    promoIds.length > 0
      ? await prisma.promo.findMany({
          where: { id: { in: promoIds } },
          select: { id: true, code: true, percent: true, discountRub: true, description: true },
        })
      : [];
  const promoById = new Map(promosById.map((p) => [p.id, p]));

  const codesForLookup = [
    ...new Set(
      ordersWithPromo
        .filter((o) => !o.promoId && o.promoCode?.trim())
        .map((o) => o.promoCode!.trim().toUpperCase())
    ),
  ];
  const promosByCode =
    codesForLookup.length > 0
      ? await prisma.promo.findMany({
          where: { code: { in: codesForLookup } },
          select: { code: true, percent: true, discountRub: true, description: true },
        })
      : [];
  const promoByCodeUpper = new Map(promosByCode.map((p) => [p.code.toUpperCase(), p]));

  type Item = {
    code: string;
    label: string;
    description: string | null;
    used: boolean;
    usedAt: string | null;
    orderId: string | null;
    validTo: string | null;
  };

  const usedItems: Item[] = [];
  const codesUsedInOrders = new Set<string>();

  for (const o of ordersWithPromo) {
    const promo = o.promoId ? promoById.get(o.promoId) : undefined;
    const promoFromCode = o.promoCode?.trim()
      ? promoByCodeUpper.get(o.promoCode.trim().toUpperCase())
      : undefined;
    const p = promo ?? promoFromCode;
    const codeRaw = p?.code ?? o.promoCode?.trim();
    if (!codeRaw?.trim()) continue;
    const code = codeRaw.trim();
    codesUsedInOrders.add(code.toUpperCase());
    const label = p ? formatPromoLine(p) : "Промокод";
    const description = p?.description ?? null;
    usedItems.push({
      code,
      label,
      description,
      used: true,
      usedAt: o.createdAt.toISOString(),
      orderId: o.id,
      validTo: null,
    });
  }

  usedItems.sort((a, b) => (b.usedAt || "").localeCompare(a.usedAt || ""));

  const rewardCodesUpper = [
    ...new Set(
      reviewRows
        .map((r) => r.rewardCode?.trim().toUpperCase())
        .filter((c): c is string => !!c && c.length > 0)
    ),
  ];
  const rewardPromos =
    rewardCodesUpper.length > 0
      ? await prisma.promo.findMany({
          where: { code: { in: rewardCodesUpper } },
          select: { code: true, percent: true, discountRub: true, description: true, validTo: true },
        })
      : [];
  const promoByUpper = new Map(rewardPromos.map((p) => [p.code.toUpperCase(), p]));

  const availableItems: Item[] = [];
  const codesListedAvailable = new Set<string>();

  for (const upper of rewardCodesUpper) {
    if (codesUsedInOrders.has(upper)) continue;
    if (codesListedAvailable.has(upper)) continue;
    codesListedAvailable.add(upper);
    const promo = promoByUpper.get(upper);
    const codeDisplay = promo?.code ?? upper;
    availableItems.push({
      code: codeDisplay,
      label: promo ? formatPromoLine(promo) : "Промокод",
      description: promo?.description ?? "Начислен за опубликованный отзыв",
      used: false,
      usedAt: null,
      orderId: null,
      validTo: promo?.validTo?.toISOString() ?? null,
    });
  }

  for (const p of activePromos.filter(promoStillUsable)) {
    const upper = p.code.toUpperCase();
    if (codesUsedInOrders.has(upper)) continue;
    if (codesListedAvailable.has(upper)) continue;
    codesListedAvailable.add(upper);
    availableItems.push({
      code: p.code,
      label: formatPromoLine(p),
      description: p.description,
      used: false,
      usedAt: null,
      orderId: null,
      validTo: p.validTo?.toISOString() ?? null,
    });
  }

  availableItems.sort((a, b) => a.code.localeCompare(b.code, "ru"));

  return NextResponse.json({ items: [...usedItems, ...availableItems] });
}

import AdminPromosClient from "./AdminPromosClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPromosPage() {
  const [promos, grouped] = await Promise.all([
    prisma.promo.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({
      by: ["promoId"],
      where: { promoId: { not: null } },
      _count: { id: true },
      _sum: { total: true },
    }),
  ]);

  const orderStatsByPromoId: Record<string, { orderCount: number; totalSum: number }> = {};
  for (const row of grouped) {
    if (row.promoId != null) {
      orderStatsByPromoId[row.promoId] = {
        orderCount: row._count.id,
        totalSum: row._sum.total ?? 0,
      };
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Скидки и промокоды</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Обычные промокоды и коды для дерматологов: скидка покупателю, учёт заказов и расчёт вознаграждения (% от
        суммы заказов с этим кодом).
      </p>
      <AdminPromosClient initialPromos={promos} orderStatsByPromoId={orderStatsByPromoId} />
    </>
  );
}

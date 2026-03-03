import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalViews, ordersByPromo, topProducts, recentOrders, allProducts, viewCounts, orderItemsByProduct] = await Promise.all([
    prisma.pageView.count(),
    prisma.order.groupBy({
      by: ["promoCode"],
      where: { promoCode: { not: null } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.pageView.groupBy({
      by: ["productId"],
      where: { productId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { productId: "desc" } },
      take: 20,
    }),
    prisma.order.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.product.findMany({ select: { id: true, slug: true, title: true }, orderBy: { title: "asc" } }),
    prisma.pageView.groupBy({
      by: ["productId"],
      where: { productId: { not: null } },
      _count: { id: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "orderId"],
      _sum: { quantity: true },
    }),
  ]);

  const productIds = topProducts.map((p) => p.productId).filter(Boolean) as string[];
  const productsForTop = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, slug: true, title: true },
  });
  const productMap = Object.fromEntries(productsForTop.map((p) => [p.id, p]));

  const viewMap = Object.fromEntries(viewCounts.map((v) => [v.productId!, v._count.id]));
  const orderIdsWithPromo = new Set(
    (await prisma.order.findMany({ where: { promoId: { not: null } }, select: { id: true } })).map((o) => o.id)
  );
  const productOrderStats: Record<string, { totalQty: number; ordersWithPromo: number; ordersWithoutPromo: number }> = {};
  for (const g of orderItemsByProduct) {
    if (!g.productId) continue;
    if (!productOrderStats[g.productId]) {
      productOrderStats[g.productId] = { totalQty: 0, ordersWithPromo: 0, ordersWithoutPromo: 0 };
    }
    const qty = g._sum.quantity ?? 0;
    productOrderStats[g.productId].totalQty += qty;
    if (orderIdsWithPromo.has(g.orderId)) productOrderStats[g.productId].ordersWithPromo += 1;
    else productOrderStats[g.productId].ordersWithoutPromo += 1;
  }

  const productStats = allProducts.map((p) => ({
    productId: p.id,
    product: p,
    viewCount: viewMap[p.id] ?? 0,
    orderCount: productOrderStats[p.id]?.totalQty ?? 0,
    ordersWithPromo: productOrderStats[p.id]?.ordersWithPromo ?? 0,
    ordersWithoutPromo: productOrderStats[p.id]?.ordersWithoutPromo ?? 0,
  }));

  return NextResponse.json({
    totalVisits: totalViews,
    ordersByPromo: ordersByPromo.map((o) => ({
      promoCode: o.promoCode,
      orderCount: o._count.id,
      totalSum: o._sum.total,
    })),
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      product: p.productId ? productMap[p.productId] : null,
      viewCount: p._count.id,
    })),
    productStats,
    recentOrders,
  });
}

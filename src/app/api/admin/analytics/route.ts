import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalViews, ordersByPromo, topProducts, recentOrders] = await Promise.all([
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
  ]);

  const productIds = topProducts.map((p) => p.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, slug: true, title: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

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
    recentOrders,
  });
}

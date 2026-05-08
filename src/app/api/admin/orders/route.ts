import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { buildOrderPromoWhere } from "@/lib/admin-order-list-filter";
import { parseAdminListPagination, totalPages } from "@/lib/admin-list-pagination";
import { prisma } from "@/lib/db";

const orderInclude = {
  items: { include: { product: { select: { slug: true, title: true } } } },
  user: { select: { id: true, email: true, name: true } },
} as const;

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const { page, limit, skip } = parseAdminListPagination(url.searchParams);
  const promo = url.searchParams.get("promo")?.trim() || undefined;
  const promos = await prisma.promo.findMany({ select: { id: true, code: true } });
  const where = buildOrderPromoWhere(promo, promos);
  const [total, data] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),
  ]);
  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: totalPages(total, limit),
  });
}

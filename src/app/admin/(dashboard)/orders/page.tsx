import AdminOrdersClient from "./AdminOrdersClient";
import { buildOrderPromoWhere } from "@/lib/admin-order-list-filter";
import { parseAdminListPaginationFromRoute, totalPages } from "@/lib/admin-list-pagination";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const orderListInclude = {
  items: { include: { product: { select: { slug: true, title: true } } } },
  user: { select: { id: true, email: true, name: true } },
} as const;

function pickString(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; promo?: string | string[] }>;
}) {
  const q = await searchParams;
  const { page, limit, skip } = parseAdminListPaginationFromRoute(q);
  const promoParam = (pickString(q.promo) ?? "").trim();
  let orders: Awaited<ReturnType<typeof prisma.order.findMany<{ include: typeof orderListInclude }>>> = [];
  let orderTotal = 0;
  let promoOptions: { id: string; code: string; isDermatologist: boolean }[] = [];
  try {
    promoOptions = await prisma.promo.findMany({
      select: { id: true, code: true, isDermatologist: true },
      orderBy: { code: "asc" },
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.error("[admin/orders] promo.findMany:", e);
    try {
      const rows = await prisma.promo.findMany({
        select: { id: true, code: true },
        orderBy: { code: "asc" },
      });
      promoOptions = rows.map((p) => ({ ...p, isDermatologist: false }));
    } catch {
      promoOptions = [];
    }
  }
  const orderWhere = buildOrderPromoWhere(
    promoParam || undefined,
    promoOptions.map((p) => ({ id: p.id, code: p.code })),
  );
  try {
    const [count, list] = await Promise.all([
      prisma.order.count({ where: orderWhere }),
      prisma.order.findMany({
        where: orderWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: orderListInclude,
      }),
    ]);
    orderTotal = count;
    orders = list;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.error("[admin/orders] order.findMany:", e);
  }
  const pagination = { page, limit, total: orderTotal, totalPages: totalPages(orderTotal, limit) };
  return (
    <>
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <p className="mt-1 text-sm text-zinc-600">Просмотр деталей и ручное редактирование заказа. Фильтр по промокоду.</p>
      <AdminOrdersClient
        key={`${page}-${orderTotal}-${promoParam}`}
        initialOrders={orders}
        promoOptions={promoOptions}
        pagination={pagination}
        promoFromUrl={promoParam}
      />
    </>
  );
}

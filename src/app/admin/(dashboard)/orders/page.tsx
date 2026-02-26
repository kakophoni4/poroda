import AdminOrdersClient from "./AdminOrdersClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof prisma.order.findMany<{ include: { items: { include: { product: { select: { slug: true; title: true } } } }; user: { select: { id: true; email: true; name: true } } } }>>> = [];
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { slug: true, title: true } } } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
  } catch {
    // БД не подключена
  }
  return (
    <>
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <p className="mt-1 text-sm text-zinc-600">Просмотр деталей и ручное редактирование заказа.</p>
      <AdminOrdersClient initialOrders={orders} />
    </>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let orderCount = 0, userCount = 0, productCount = 0;
  try {
    [orderCount, userCount, productCount] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count(),
    ]);
  } catch {
    // БД не подключена
  }

  const stats = [
    { label: "Заказов", value: String(orderCount), href: "/admin/orders" },
    { label: "Клиентов", value: String(userCount), href: "/admin/users" },
    { label: "Товаров", value: String(productCount), href: "/admin/products" },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <p className="mt-1 text-sm text-zinc-600">Сводка по заказам, клиентам и каталогу.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 hover:bg-zinc-100">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 text-sm text-zinc-600">{s.label}</div>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="font-semibold">Разделы</h2>
        <p className="mt-2 text-sm text-zinc-600">
          <Link href="/admin/orders" className="underline">Заказы</Link> — просмотр и ручное редактирование.{" "}
          <Link href="/admin/analytics" className="underline">Аналитика</Link> — посещения, топ товаров, заказы по промокодам.
        </p>
      </div>
    </>
  );
}

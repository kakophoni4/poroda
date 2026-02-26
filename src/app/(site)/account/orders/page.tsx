import Breadcrumbs from "@/components/Breadcrumbs";

export default function AccountOrdersPage() {
  const orders = [
    { id: "order-1", date: "2025-02-15", total: 3177, status: "Доставлен" },
    { id: "order-2", date: "2025-02-01", total: 6900, status: "Доставлен" },
  ];

  return (
    <>
      <Breadcrumbs items={[{ href: "/account", label: "Личный кабинет" }, { label: "История заказов" }]} />
      <h1 className="mt-4 text-2xl font-semibold">История заказов</h1>
      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
            Пока нет заказов. <a href="/catalog" className="underline hover:text-zinc-900">Перейти в каталог</a>
          </p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
              <div>
                <span className="font-medium">{o.id}</span>
                <span className="ml-2 text-sm text-zinc-500">{o.date}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{o.total.toLocaleString("ru-RU")} ₽</span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{o.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

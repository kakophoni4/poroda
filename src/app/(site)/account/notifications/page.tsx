import Breadcrumbs from "@/components/Breadcrumbs";

export default function AccountNotificationsPage() {
  const notifications = [
    { title: "Заказ доставлен", text: "Заказ order-1 получен. Спасибо за покупку!", date: "2025-02-18", read: true },
    { title: "Акция: скидка 15% на наборы", text: "До конца недели — скидка на все наборы PORODA.", date: "2025-02-17", read: false },
  ];

  return (
    <>
      <Breadcrumbs items={[{ href: "/account", label: "Личный кабинет" }, { label: "Уведомления" }]} />
      <h1 className="mt-4 text-2xl font-semibold">Уведомления</h1>
      <p className="mt-2 text-sm text-zinc-600">Статус заказов, акции и новости.</p>
      <div className="mt-6 space-y-3">
        {notifications.map((n, i) => (
          <div key={i} className={`rounded-3xl border p-5 ${n.read ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">{n.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{n.text}</p>
                <p className="mt-2 text-xs text-zinc-500">{n.date}</p>
              </div>
              {!n.read && <span className="shrink-0 h-2 w-2 rounded-full bg-zinc-900" title="Новое" />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

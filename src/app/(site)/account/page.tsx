import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AccountPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Личный кабинет" }]} />
      <h1 className="mt-4 text-2xl font-semibold">Личный кабинет</h1>
      <p className="mt-2 text-sm text-zinc-600">Добро пожаловать. Здесь — заказы, персональные скидки и уведомления.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="liquidGlass-dock rounded-3xl border border-white/40 p-6 transition-premium">
          <h2 className="text-lg font-semibold">История заказов</h2>
          <p className="mt-2 text-sm text-zinc-600">Отслеживайте статус и повторяйте заказы.</p>
        </Link>
        <Link href="/account/discounts" className="liquidGlass-dock rounded-3xl border border-white/40 p-6 transition-premium">
          <h2 className="text-lg font-semibold">Скидки</h2>
          <p className="mt-2 text-sm text-zinc-600">Персональные промокоды и накопительная скидка.</p>
        </Link>
        <Link href="/account/notifications" className="liquidGlass-dock rounded-3xl border border-white/40 p-6 transition-premium sm:col-span-2">
          <h2 className="text-lg font-semibold">Уведомления</h2>
          <p className="mt-2 text-sm text-zinc-600">Статус заказов, новости и акции — в одном месте.</p>
        </Link>
      </div>
    </>
  );
}

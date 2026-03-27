import Link from "next/link";
import { Suspense } from "react";
import OrderThanksBanner from "./OrderThanksBanner";
import { accountCardClass } from "./account-ui";

export default function AccountPage() {
  return (
    <>
      <Suspense fallback={null}>
        <OrderThanksBanner />
      </Suspense>
      <h1 className="text-2xl font-semibold">Личный кабинет</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className={`${accountCardClass} block transition hover:border-zinc-300`}>
          <h2 className="text-lg font-semibold">История заказов</h2>
        </Link>
        <Link href="/account/discounts" className={`${accountCardClass} block transition hover:border-zinc-300`}>
          <h2 className="text-lg font-semibold">Скидки</h2>
        </Link>
        <Link href="/account/notifications" className={`${accountCardClass} block transition hover:border-zinc-300 sm:col-span-2`}>
          <h2 className="text-lg font-semibold">Уведомления</h2>
        </Link>
      </div>
    </>
  );
}

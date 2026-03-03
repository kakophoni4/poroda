"use client";

import { useEffect, useState } from "react";

type ProductStat = {
  productId: string;
  product: { id: string; slug: string; title: string };
  viewCount: number;
  orderCount: number;
  ordersWithPromo: number;
  ordersWithoutPromo: number;
};

type Analytics = {
  totalVisits: number;
  ordersByPromo: { promoCode: string | null; orderCount: number; totalSum: number | null }[];
  topProducts: { productId: string | null; product: { id: string; slug: string; title: string } | null; viewCount: number }[];
  productStats?: ProductStat[];
  recentOrders: unknown[];
};

export default function AdminAnalyticsClient() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="mt-6 text-sm text-zinc-500">Загрузка…</p>;

  return (
    <div className="mt-6 space-y-8">
      <div className="rounded-2xl border border-zinc-200 p-6">
        <h3 className="font-medium">Всего посещений (просмотров страниц)</h3>
        <p className="mt-2 text-3xl font-semibold">{data.totalVisits.toLocaleString("ru-RU")}</p>
        <p className="mt-1 text-sm text-zinc-500">Учитывается каждый переход на страницу (в т.ч. каталог, карточка товара).</p>
      </div>

      {data.productStats && data.productStats.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-medium">Аналитика по каждому товару</h3>
          <p className="mt-1 text-sm text-zinc-500">Переходы на карточку, сколько раз заказали, с промокодом или без.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-600">
                  <th className="pb-2 pr-4">Товар</th>
                  <th className="pb-2 pr-4 text-right">Переходы</th>
                  <th className="pb-2 pr-4 text-right">Заказано (шт)</th>
                  <th className="pb-2 pr-4 text-right">Заказов с промо</th>
                  <th className="pb-2 text-right">Заказов без промо</th>
                </tr>
              </thead>
              <tbody>
                {data.productStats.map((row) => (
                  <tr key={row.productId} className="border-b border-zinc-100">
                    <td className="py-2 pr-4 font-medium">{row.product.title}</td>
                    <td className="py-2 pr-4 text-right">{row.viewCount.toLocaleString("ru-RU")}</td>
                    <td className="py-2 pr-4 text-right">{row.orderCount.toLocaleString("ru-RU")}</td>
                    <td className="py-2 pr-4 text-right">{row.ordersWithPromo.toLocaleString("ru-RU")}</td>
                    <td className="py-2 text-right">{row.ordersWithoutPromo.toLocaleString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 p-6">
        <h3 className="font-medium">Топ просматриваемых товаров</h3>
        <ul className="mt-4 space-y-2">
          {data.topProducts.length === 0 ? (
            <li className="text-sm text-zinc-500">Пока нет данных. Переходы на карточки товаров записываются автоматически.</li>
          ) : (
            data.topProducts.map((row) => (
              <li key={row.productId || row.viewCount} className="flex justify-between text-sm">
                <span>{row.product?.title ?? "Товар удалён"}</span>
                <span className="text-zinc-500">{row.viewCount} переходов</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-6">
        <h3 className="font-medium">Заказы по промокодам</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-600">
              <th className="pb-2 pr-4">Промокод</th>
              <th className="pb-2 pr-4">Кол-во заказов</th>
              <th className="pb-2">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {data.ordersByPromo.map((row) => (
              <tr key={row.promoCode || "none"} className="border-b border-zinc-100">
                <td className="py-2 pr-4 font-mono">{row.promoCode || "—"}</td>
                <td className="py-2 pr-4">{row.orderCount}</td>
                <td className="py-2">{row.totalSum != null ? `${row.totalSum.toLocaleString("ru-RU")} ₽` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-6">
        <h3 className="font-medium">Последние заказы</h3>
        <p className="mt-1 text-sm text-zinc-600">Полный список — в разделе <a href="/admin/orders" className="underline">Заказы</a>.</p>
      </div>
    </div>
  );
}

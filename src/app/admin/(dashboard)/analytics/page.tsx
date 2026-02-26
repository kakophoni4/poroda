import AdminAnalyticsClient from "./AdminAnalyticsClient";

export default function AdminAnalyticsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Аналитика</h1>
      <p className="mt-1 text-sm text-zinc-600">Посещения сайта, топ товаров, заказы по промокодам, детали заказов.</p>
      <AdminAnalyticsClient />
    </>
  );
}

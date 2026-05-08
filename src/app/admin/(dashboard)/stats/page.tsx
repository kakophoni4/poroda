import AdminStatsClient from "./AdminStatsClient";

export default function AdminStatsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Статистика визитов</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Просмотры — все обращения к страницам. Уникальные пользователи — по аккаунту (только с авторизацией). «Сессии» по IP
        (хеш) — суточная уникальность гостя без сырого IP.
      </p>
      <AdminStatsClient />
    </>
  );
}

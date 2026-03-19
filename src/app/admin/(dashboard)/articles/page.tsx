import AdminArticlesClient from "./AdminArticlesClient";
import { getHomeArticlesForAdmin } from "@/lib/home-articles";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await getHomeArticlesForAdmin();
  return (
    <>
      <h1 className="text-2xl font-semibold">Статьи (Исследования косметологии)</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Блок на главной с заголовком «Исследования косметологии». Укажите название статьи, ссылку и описание — при клике пользователь перейдёт по ссылке.
      </p>
      <AdminArticlesClient initial={articles} />
    </>
  );
}

import AdminHomeConcernCardsClient from "./AdminHomeConcernCardsClient";
import { getHomeConcernCardsForAdmin } from "@/lib/home-concern-cards";

export const dynamic = "force-dynamic";

export default async function AdminConcernsPage() {
  const cards = await getHomeConcernCardsForAdmin();
  return (
    <>
      <h1 className="text-2xl font-semibold">Карточки «Выберите вашу проблему»</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Горизонтальная карусель сразу под баннерами: фото, заголовок, фильтр каталога при клике. Редактируйте карточки ниже.
      </p>
      <AdminHomeConcernCardsClient initial={cards} />
    </>
  );
}

/** Тип и хелпер для карточек проблем — без зависимостей от БД (для клиентских компонентов). */

export type HomeConcernCardPublic = {
  id: string;
  title: string;
  imageUrl: string;
  catalogQuery: string;
};

export function concernCardLink(card: { catalogQuery: string }): string {
  const q = (card.catalogQuery || "").trim();
  if (!q) return "/catalog";
  return `/catalog?${q.startsWith("?") ? q.slice(1) : q}`;
}

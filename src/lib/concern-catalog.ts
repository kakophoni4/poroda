/** В админке «Проблемы»: подборка товаров по тегам на карточках. */
export const CONCERN_TAGS_QUERY = "__tags__";

export function resolveConcernCatalogQuery(catalogQuery: string, cardId: string): string {
  const q = (catalogQuery || "").trim();
  if (q === CONCERN_TAGS_QUERY || q === "") return `concern=${cardId}`;
  return q;
}

export function sanitizeConcernIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .map((id) => id.trim())
    .slice(0, 24);
}

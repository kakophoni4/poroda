/** Параметры `?page=&limit=` для админ-списков: limit по умолчанию 50, максимум 200. */
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function parseAdminListPagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  let limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function totalPages(total: number, limit: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}

/** Для `page.tsx` (App Router): `const raw = await searchParams` */
export function parseAdminListPaginationFromRoute(
  sp: { page?: string | string[]; limit?: string | string[] } | undefined
): { page: number; limit: number; skip: number } {
  const u = new URLSearchParams();
  const p = sp?.page;
  const l = sp?.limit;
  if (typeof p === "string") u.set("page", p);
  else if (Array.isArray(p) && p[0]) u.set("page", p[0]);
  if (typeof l === "string") u.set("limit", l);
  else if (Array.isArray(l) && l[0]) u.set("limit", l[0]);
  return parseAdminListPagination(u);
}

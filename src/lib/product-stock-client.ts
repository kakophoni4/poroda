export type ProductStockInfo = { id: string; inStock: boolean; archivedAt: string | null };

/**
 * Снимок наличия/архива по id (сервер). Не дёргать localStorage/CSRF.
 */
export async function fetchProductStockByIds(
  productIds: string[]
): Promise<ProductStockInfo[] | null> {
  if (productIds.length === 0) return [];
  const u = new URL(
    "/api/products/by-ids",
    typeof window !== "undefined" ? window.location.origin : "http://local"
  );
  u.searchParams.set("ids", [...new Set(productIds)].slice(0, 50).join(","));
  try {
    const res = await fetch(u.toString());
    if (!res.ok) return null;
    const d = (await res.json()) as { products?: unknown };
    if (!d.products || !Array.isArray(d.products)) return null;
    return d.products.map((x: unknown) => {
      const o = x as { id?: string; inStock?: boolean; archivedAt?: string | null };
      return {
        id: typeof o.id === "string" ? o.id : "",
        inStock: o.inStock === true,
        archivedAt: o.archivedAt == null ? null : String(o.archivedAt),
      };
    });
  } catch {
    return null;
  }
}

export function lineIsUnavailable(row: ProductStockInfo | undefined): boolean {
  if (row == null) return true;
  if (row.archivedAt != null) return true;
  if (!row.inStock) return true;
  return false;
}

export const CART_STOCK_THROTTLE_KEY = "poroda-cart-by-ids-at";
export const STOCK_THROTTLE_MS = 30_000;

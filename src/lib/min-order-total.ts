/** Админ/API: пусто/null → нет порога; иначе целое ≥ 0. */
export function parseMinOrderTotal(
  v: unknown
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (v === undefined || v === null || v === "") return { ok: true, value: null };
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: "Мин. сумма заказа: неотрицательное целое число" };
  }
  return { ok: true, value: n };
}

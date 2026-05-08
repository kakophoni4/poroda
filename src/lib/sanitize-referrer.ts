/** Параметры, которые убираем из URL реферера (в т.ч. utm_*, utm_token, кликовые id). */
const AD_AND_UTM_PARAM_NAMES = new Set([
  "gclid",
  "fbclid",
  "msclkid",
  "twclid",
  "li_fat_id",
  "yclid",
  "utm_token",
  "_ga",
  "_gl",
]);

function isTrackingQueryParam(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower === "utm_token" || lower.startsWith("utm_")) return true;
  return AD_AND_UTM_PARAM_NAMES.has(lower);
}

/** Возвращает ссылку реферера без маркетинговых/UTM-параметров или null, если смысла нет. */
export function sanitizePageViewReferrer(ref: string | null | undefined): string | null {
  if (ref == null) return null;
  const trimmed = String(ref).trim();
  if (!trimmed) return null;
  const hardCap = 2000;
  const s = trimmed.length > hardCap ? trimmed.slice(0, hardCap) : trimmed;
  try {
    const u = new URL(s);
    for (const k of [...u.searchParams.keys()]) {
      if (isTrackingQueryParam(k)) u.searchParams.delete(k);
    }
    u.hash = "";
    const out = u.toString();
    return out.length > 0 ? (out.length > hardCap ? out.slice(0, hardCap) : out) : null;
  } catch {
    return s.slice(0, 500);
  }
}

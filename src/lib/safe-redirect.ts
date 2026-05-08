/**
 * Разрешает только внутренние относительные пути (next/router.push, Link href с тем же origin).
 * Не допускает open-redirect и scheme-based URI.
 */
export function safeNextPath(input: string | null | undefined, fallback = "/account"): string {
  if (input == null) return fallback;
  const s = String(input);
  if (s.length === 0 || s.length > 200) return fallback;
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return fallback;
  if (s.includes("://")) return fallback;
  if (s.includes("\n") || s.includes("\r") || s.includes("\t")) return fallback;
  return s;
}

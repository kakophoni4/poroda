export function isSameOrigin(request: Request): boolean {
  const allowed = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) allowed.add(new URL(site).origin);
  // dev: разрешаем localhost и LAN dev origins из next.config (allowedDevOrigins)
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (origin) return allowed.has(origin);
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  // Нет ни Origin, ни Referer (curl/server-to-server) — для мутаций отвергаем.
  return false;
}

export function assertSameOrigin(request: Request): Response | null {
  if (isSameOrigin(request)) return null;
  return new Response(JSON.stringify({ error: "Cross-origin request blocked" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

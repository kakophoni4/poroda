function addOrigin(allowed: Set<string>, raw: string | null | undefined) {
  if (!raw?.trim()) return;
  try {
    allowed.add(new URL(raw.trim()).origin);
  } catch {
    /* ignore */
  }
}

export function isSameOrigin(request: Request): boolean {
  const allowed = new Set<string>();
  addOrigin(allowed, process.env.NEXT_PUBLIC_SITE_URL);

  // Host из запроса (IP VPS, www, порт nginx) — не только NEXT_PUBLIC_SITE_URL
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (hostHeader) {
    const host = hostHeader.split(",")[0]?.trim();
    const proto = (request.headers.get("x-forwarded-proto") ?? "http").split(",")[0]?.trim() || "http";
    if (host) addOrigin(allowed, `${proto}://${host}`);
  }

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

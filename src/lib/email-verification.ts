import { createHash, randomBytes } from "node:crypto";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

export function siteBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function generateVerificationToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Ссылка на страницу подтверждения: клиент отправляет токен POST /api/auth/verify-email
 * (в письмах — полный URL, если задан NEXT_PUBLIC_SITE_URL).
 */
export function buildVerifyEmailUrl(token: string): { absolute: string | null; path: string } {
  const path = `/verify-email/${encodeURIComponent(token)}`;
  const site = siteBaseUrl();
  return { absolute: site ? `${site}${path}` : null, path };
}

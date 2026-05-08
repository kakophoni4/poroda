import { createHash, randomBytes } from "node:crypto";

const TTL_MS = 60 * 60 * 1000; // 1 час

export function generateResetToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

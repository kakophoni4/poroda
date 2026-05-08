import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "poroda_session";
const ADMIN_COOKIE = "poroda_admin";
const SECRET = process.env.SESSION_SECRET || "change-me-in-production";
const SALT_ROUNDS = 10;

const USER_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 дней
const ADMIN_TTL_SECONDS = 60 * 60 * 8; // 8 часов

if (process.env.NODE_ENV === "production" && SECRET === "change-me-in-production") {
  /** В проде без секрета сессии тривиально подделываются. Громко падаем при первом импорте. */
  throw new Error("SESSION_SECRET is not set. Generate a strong random string and put it in .env");
}

export type UserSession = { userId: string; email: string };
export type AdminSession = { adminId: string; email: string };

type SignedPayload<T> = T & { exp: number };

function toBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(sig);
}

/** Кодирует токен формата `<base64url(payload)>.<base64url(hmac)>`. */
async function sign<T extends object>(payload: T, ttlSeconds: number): Promise<string> {
  const full: SignedPayload<T> = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(full)));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

/** Проверяет подпись и срок. Возвращает payload без `exp` или null. */
async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: string;
  try {
    expected = await hmac(body);
  } catch {
    return null;
  }
  if (!constantTimeEqual(sig, expected)) return null;
  let parsed: SignedPayload<T>;
  try {
    parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SignedPayload<T>;
  } catch {
    return null;
  }
  if (typeof parsed.exp !== "number" || parsed.exp * 1000 < Date.now()) return null;
  const { exp: _exp, ...rest } = parsed;
  void _exp;
  return rest as T;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Edge-/Node-совместимая проверка для middleware (без `next/headers`). */
export async function verifyUserSessionToken(token: string | undefined | null): Promise<UserSession | null> {
  const payload = await verify<UserSession>(token ?? undefined);
  if (!payload?.userId) return null;
  return { userId: payload.userId, email: payload.email };
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<AdminSession | null> {
  const payload = await verify<AdminSession>(token ?? undefined);
  if (!payload?.adminId) return null;
  return { adminId: payload.adminId, email: payload.email };
}

export async function getUserSession(): Promise<UserSession | null> {
  const c = await cookies();
  return verifyUserSessionToken(c.get(SESSION_COOKIE)?.value);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const c = await cookies();
  return verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value);
}

export async function setUserSession(session: UserSession): Promise<void> {
  const token = await sign(session, USER_TTL_SECONDS);
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: USER_TTL_SECONDS,
    path: "/",
  });
}

export async function setAdminSession(session: AdminSession): Promise<void> {
  const token = await sign(session, ADMIN_TTL_SECONDS);
  const c = await cookies();
  c.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_TTL_SECONDS,
    path: "/",
  });
}

export async function clearUserSession(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

export async function clearAdminSession(): Promise<void> {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;

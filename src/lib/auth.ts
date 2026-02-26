import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "poroda_session";
const ADMIN_COOKIE = "poroda_admin";
const SECRET = process.env.SESSION_SECRET || "change-me-in-production";
const SALT_ROUNDS = 10;

function encode(payload: object): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf-8").toString("base64url");
}

function decode<T>(token: string): T | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type UserSession = { userId: string; email: string };
export type AdminSession = { adminId: string; email: string };

export async function getUserSession(): Promise<UserSession | null> {
  const c = await cookies();
  const raw = c.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = decode<UserSession & { exp?: number }>(raw);
  if (!payload?.userId) return null;
  return { userId: payload.userId, email: payload.email };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const c = await cookies();
  const raw = c.get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  const payload = decode<AdminSession & { exp?: number }>(raw);
  if (!payload?.adminId) return null;
  return { adminId: payload.adminId, email: payload.email };
}

export async function setUserSession(session: UserSession): Promise<void> {
  const c = await cookies();
  c.set(SESSION_COOKIE, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function setAdminSession(session: AdminSession): Promise<void> {
  const c = await cookies();
  c.set(ADMIN_COOKIE, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
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

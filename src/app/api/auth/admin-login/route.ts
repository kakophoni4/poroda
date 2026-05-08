import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import {
  checkAuthRateLimit,
  hashIp,
  pruneAuthAttemptsForIdentifier,
  recordAuthAttempt,
} from "@/lib/rate-limit";

/** Валидный bcrypt-хэш, чтобы `bcrypt.compare` тратил то же время, когда админа нет. */
const DUMMY_PASSWORD_HASH =
  "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQubK15uPfQXVSda30y6S1bwyqKeS";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  if (!process.env.DATABASE_URL) {
    console.error("Admin login: DATABASE_URL is not set");
    return NextResponse.json(
      { error: "Сервер не настроен: отсутствует DATABASE_URL" },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };
    const identifier = email?.trim() ? email.trim().toLowerCase() : "anon";
    const rate = await checkAuthRateLimit({ scope: "admin_login", identifier, request });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток. Повторите позже.", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
    }
    const ipHash = hashIp(request);
    const emailNorm = email.trim().toLowerCase();
    const admin = await prisma.admin.findUnique({ where: { email: emailNorm } });
    let ok: boolean;
    if (!admin) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      ok = false;
    } else {
      ok = await verifyPassword(password, admin.passwordHash);
    }
    await recordAuthAttempt({
      scope: "admin_login",
      identifier: emailNorm,
      ipHash,
      success: ok,
    });
    if (!ok || !admin) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }
    await pruneAuthAttemptsForIdentifier("admin_login", admin.email);
    await setAdminSession({ adminId: admin.id, email: admin.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    console.error("Admin login error:", err?.name, err?.message, err);
    const isDbError =
      err?.message?.includes("connect") ||
      err?.message?.includes("ECONNREFUSED") ||
      err?.message?.includes("Prisma") ||
      err?.message?.includes("connection");
    return NextResponse.json(
      { error: isDbError ? "Ошибка подключения к базе данных" : "Ошибка входа" },
      { status: 500 }
    );
  }
}

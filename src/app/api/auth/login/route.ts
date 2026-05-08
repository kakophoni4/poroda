import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setUserSession } from "@/lib/auth";
import { backfillPromoUseForUser } from "@/lib/backfill-promo-use";
import { assertSameOrigin } from "@/lib/csrf";
import {
  checkAuthRateLimit,
  hashIp,
  pruneAuthAttemptsForIdentifier,
  recordAuthAttempt,
} from "@/lib/rate-limit";

/** Валидный bcrypt-хэш, чтобы `bcrypt.compare` тратил то же время, когда пользователя нет. */
const DUMMY_PASSWORD_HASH =
  "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQubK15uPfQXVSda30y6S1bwyqKeS";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };
    const identifier = email?.trim() ? email.trim().toLowerCase() : "anon";
    const rate = await checkAuthRateLimit({ scope: "user_login", identifier, request });
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
    const user = await prisma.user.findUnique({ where: { email: emailNorm } });
    let ok: boolean;
    if (!user) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      ok = false;
    } else {
      ok = await verifyPassword(password, user.passwordHash);
    }
    await recordAuthAttempt({
      scope: "user_login",
      identifier: emailNorm,
      ipHash,
      success: ok,
    });
    if (!ok || !user) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }
    await pruneAuthAttemptsForIdentifier("user_login", user.email);
    await prisma.order.updateMany({
      where: { userId: null, email: { equals: user.email, mode: "insensitive" } },
      data: { userId: user.id },
    });
    await backfillPromoUseForUser(user.id);
    await setUserSession({ userId: user.id, email: user.email });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}

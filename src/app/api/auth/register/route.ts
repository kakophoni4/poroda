import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setUserSession } from "@/lib/auth";
import { backfillPromoUseForUser } from "@/lib/backfill-promo-use";
import { validatePassword } from "@/lib/password-policy";
import { assertSameOrigin } from "@/lib/csrf";
import { buildVerifyEmailUrl, generateVerificationToken } from "@/lib/email-verification";
import { renderEmail, sendMail } from "@/lib/mailer";
import {
  checkAuthRateLimit,
  hashIp,
  pruneAuthAttemptsForIdentifier,
  recordAuthAttempt,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const body = await request.json();
    const { email, password, name, phone } = body as {
      email: string;
      password: string;
      name?: string;
      phone?: string;
    };
    const identifier = email?.trim() ? email.trim().toLowerCase() : "anon";
    const rate = await checkAuthRateLimit({ scope: "register", identifier, request });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток. Повторите позже.", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Укажите email" }, { status: 400 });
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.reason }, { status: 400 });
    }
    const emailNorm = email.trim().toLowerCase();
    const ipHash = hashIp(request);
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      await recordAuthAttempt({
        scope: "register",
        identifier: emailNorm,
        ipHash,
        success: false,
      });
      return NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        passwordHash,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
      },
    });
    const { token, tokenHash, expiresAt } = generateVerificationToken();
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    const { absolute, path: verifyPath } = buildVerifyEmailUrl(token);
    const verifyUrl = absolute ?? verifyPath;
    if (absolute) {
      void sendMail({
        to: emailNorm,
        subject: "Подтвердите ваш email — PORODA",
        text: `Подтвердите email, открыв ссылку: ${absolute}`,
        html: renderEmail({
          title: "Подтвердите ваш email",
          bodyHtml: "<p>Нажмите на кнопку ниже, чтобы подтвердить почту.</p>",
          ctaLabel: "Подтвердить email",
          ctaHref: verifyUrl,
          recipientName: user.name,
        }),
      });
    } else {
      console.error("NEXT_PUBLIC_SITE_URL is not set: cannot send verification email");
    }
    await prisma.userNotification.create({
      data: {
        userId: user.id,
        title: "Подтвердите email",
        body: `Пройдите по ссылке для подтверждения: ${verifyUrl}`,
      },
    });
    await recordAuthAttempt({ scope: "register", identifier: emailNorm, ipHash, success: true });
    await pruneAuthAttemptsForIdentifier("register", user.email);
    await prisma.order.updateMany({
      where: { userId: null, email: { equals: user.email, mode: "insensitive" } },
      data: { userId: user.id },
    });
    await backfillPromoUseForUser(user.id);
    await setUserSession({ userId: user.id, email: user.email });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Ошибка регистрации" }, { status: 500 });
  }
}

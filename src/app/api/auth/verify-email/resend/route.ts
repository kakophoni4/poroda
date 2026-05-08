import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { buildVerifyEmailUrl, generateVerificationToken } from "@/lib/email-verification";
import { renderEmail, sendMail } from "@/lib/mailer";
import { checkAuthRateLimit, hashIp, recordAuthAttempt } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, emailVerifiedAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.emailVerifiedAt != null) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    const email = user.email;
    const rate = await checkAuthRateLimit({ scope: "verify_resend", identifier: email, request });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток. Повторите позже.", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }
    const { token, tokenHash, expiresAt } = generateVerificationToken();
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    const { absolute, path: verifyPath } = buildVerifyEmailUrl(token);
    const verifyUrl = absolute ?? verifyPath;
    if (absolute) {
      void sendMail({
        to: email,
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
    const ipHash = hashIp(request);
    await recordAuthAttempt({ scope: "verify_resend", identifier: email, ipHash, success: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify-email resend error:", e);
    return NextResponse.json({ error: "Ошибка запроса" }, { status: 500 });
  }
}

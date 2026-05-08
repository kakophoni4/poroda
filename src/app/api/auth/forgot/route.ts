import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertSameOrigin } from "@/lib/csrf";
import { checkAuthRateLimit, hashIp, recordAuthAttempt } from "@/lib/rate-limit";
import { renderEmail, sendMail } from "@/lib/mailer";
import { generateResetToken } from "@/lib/password-reset";

function siteBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const body = await request.json() as { email?: string };
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    if (!email) {
      return NextResponse.json({ error: "Укажите email" }, { status: 400 });
    }

    const rate = await checkAuthRateLimit({ scope: "password_reset", identifier: email, request });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток. Повторите позже.", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    const ipHash = hashIp(request);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const { token, tokenHash, expiresAt } = generateResetToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const site = siteBaseUrl();
      if (!site) {
        console.error("NEXT_PUBLIC_SITE_URL is not set: cannot build password reset URL");
        return NextResponse.json({ error: "Сервер не настроен" }, { status: 500 });
      }
      const url = `${site}/reset-password/${token}`;
      void sendMail({
        to: user.email,
        subject: "Сброс пароля — PORODA",
        text: `Ссылка для сброса пароля (действует 1 час): ${url}`,
        html: renderEmail({
          title: "Сброс пароля",
          bodyHtml: `<p>Мы получили запрос на сброс пароля. Если вы его не оставляли, проигнорируйте письмо.</p><p>Чтобы задать новый пароль, нажмите кнопку — ссылка одноразовая и действительна 1 час.</p>`,
          ctaLabel: "Задать новый пароль",
          ctaHref: url,
        }),
      });

      await prisma.userNotification.create({
        data: {
          userId: user.id,
          title: "Запрошен сброс пароля",
          body: `Ссылка действительна 1 час: ${url}`,
        },
      });
    }

    await recordAuthAttempt({ scope: "password_reset", identifier: email, ipHash, success: true });

    return NextResponse.json({
      ok: true,
      message: "Если email зарегистрирован, мы отправили ссылку.",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ error: "Ошибка запроса" }, { status: 500 });
  }
}

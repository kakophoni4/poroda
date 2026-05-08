import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { escapeHtml, renderEmail, sendMailWithResult } from "@/lib/mailer";
import { checkAuthRateLimit, hashIp, recordAuthAttempt } from "@/lib/rate-limit";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { prisma } from "@/lib/db";

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const mailings = await prisma.mailing.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(mailings);
}

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rate = await checkAuthRateLimit({
    scope: "admin_mailing",
    identifier: session.email,
    request,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Слишком много рассылок. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const body = await request.json();
  const { subject, body: mailBody, sendEmail, sendInbox } = body as {
    subject: string;
    body: string;
    sendEmail?: boolean;
    sendInbox?: boolean;
  };
  const doEmail = sendEmail !== false;
  const doInbox = sendInbox !== false;
  if (!subject?.trim()) return NextResponse.json({ error: "subject обязателен" }, { status: 400 });

  const bodyHtml = sanitizeRichHtml((mailBody ?? "").trim() || "");
  let htmlForEmail: string | null = null;
  if (doEmail) {
    const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    if (!siteBase) {
      return NextResponse.json(
        { error: "Для писем нужен NEXT_PUBLIC_SITE_URL (ссылки в письме и отписка)." },
        { status: 500 }
      );
    }
    const unsubUrl = `${siteBase}/account/notifications?utm_source=mailing`;
    const unsubBlock = `<p style="font-size:12px;color:#71717a;line-height:1.5;margin:0 0 16px 0">
<a href="${escapeHtml(unsubUrl)}" style="color:#52525b">Отписаться</a> от писем с акциями и новостями. Чтобы больше не получать рассылку, откройте <a href="${escapeHtml(
      unsubUrl
    )}" style="color:#52525b">личный кабинет</a> — раздел «Уведомления» — и отключите «Получать акции и новости на почту».
</p>`;
    htmlForEmail = renderEmail({
      title: subject.trim(),
      bodyHtml: `${unsubBlock}${bodyHtml}`,
      ctaLabel: "Открыть сайт",
      ctaHref: siteBase,
    });
  }

  const mailing = await prisma.mailing.create({
    data: { subject: subject.trim(), body: (mailBody ?? "").trim() || "" },
  });

  let sentInbox = 0;
  let sentEmailOk = 0;
  let sentEmailFail = 0;

  if (doInbox) {
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const notifBody = (mailBody ?? "").trim() || null;
    if (allUsers.length) {
      await prisma.userNotification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          title: subject.trim(),
          body: notifBody,
        })),
      });
    }
    sentInbox = allUsers.length;
  }

  if (doEmail && htmlForEmail) {
    const emailUsers = await prisma.user.findMany({
      where: { marketingOptIn: true, emailVerifiedAt: { not: null } },
      select: { email: true, id: true },
    });
    for (let i = 0; i < emailUsers.length; i += BATCH_SIZE) {
      const batch = emailUsers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((u) =>
          sendMailWithResult({
            to: u.email,
            subject: subject.trim(),
            html: htmlForEmail,
          })
        )
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) sentEmailOk += 1;
        else sentEmailFail += 1;
      }
      if (i + BATCH_SIZE < emailUsers.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }
  }

  const updated = await prisma.mailing.update({
    where: { id: mailing.id },
    data: {
      sentAt: new Date(),
      sentInbox: doInbox ? sentInbox : 0,
      sentEmailOk: doEmail ? sentEmailOk : 0,
      sentEmailFail: doEmail ? sentEmailFail : 0,
    },
  });

  const ipHash = hashIp(request);
  await recordAuthAttempt({
    scope: "admin_mailing",
    identifier: session.email,
    ipHash,
    success: true,
  });

  return NextResponse.json({ ...updated, sentTo: sentInbox, sentInbox });
}

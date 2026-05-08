import nodemailer from "nodemailer";

const TIMEOUT_MS = 10_000;

let transporter: nodemailer.Transporter | null = null;

function isMailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === "true";
}

function getSmtpConfig(): { host: string; port: number; secure: boolean; user: string; pass: string } | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number.parseInt(process.env.SMTP_PORT || "465", 10);
  if (!Number.isFinite(port)) return null;
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER?.trim();
  if (!user) return null;
  const pass = process.env.SMTP_PASSWORD ?? "";
  return { host, port, secure, user, pass };
}

function getOrCreateTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const cfg = getSmtpConfig();
  if (!cfg) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  return transporter;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type SendMailInput = { to: string; subject: string; html: string; text?: string };

/** Простой текстовый вариант без внешних библиотек. */
function defaultPlainTextFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Скромная вёрстка: inline-стили, 560px, цвета в духе сайта (zinc-900 / нейтралы).
 * Без картинок и внешних шрифтов.
 */
export function renderEmail(params: {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Имя получателя — приветствие в начале письма */
  recipientName?: string | null;
}): string {
  const { title, bodyHtml, ctaLabel, ctaHref, recipientName } = params;
  const greeting = recipientName?.trim()
    ? `<p style="margin:0 0 16px 0">Здравствуйте, ${escapeHtml(recipientName.trim())}!</p>`
    : "";
  const ctaBlock =
    ctaLabel && ctaHref
      ? `<p style="margin:24px 0 0 0;text-align:center">
  <a href="${escapeHtml(
    ctaHref
  )}" style="display:inline-block;padding:12px 24px;background-color:#18181b;color:#fafaf9;text-decoration:none;border-radius:4px;font-size:15px;font-weight:600;letter-spacing:0.01em">` +
        escapeHtml(ctaLabel) +
        `</a>
</p>`
      : "";
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:8px">
        <tr>
          <td style="padding:32px 28px 8px 28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:20px;font-weight:600;color:#18181b;line-height:1.3">
            ${escapeHtml(title)}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 24px 28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#3f3f46">
            ${greeting}
            ${bodyHtml}
            ${ctaBlock}
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;line-height:1.5;color:#71717a">
            PORODA Cosmetics — космецевтика, созданная в России.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Транспорт создаётся лениво. Ошибки SMTP только в лог (без throw), доставка не гарантируется.
 */
export async function sendMail(input: SendMailInput): Promise<void> {
  await sendMailWithResult(input);
}

/**
 * @returns true, если письмо доставлено (или рассылка отключена — без сбоев);
 *          false, если нет from/транспорта или SMTP вернул ошибку.
 */
export async function sendMailWithResult(input: SendMailInput): Promise<boolean> {
  if (!isMailEnabled()) {
    console.info("[mail disabled]", input.to, input.subject);
    return true;
  }
  const from = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (!from) {
    console.error("[mail] EMAIL_FROM / SMTP_USER not set");
    return false;
  }
  const transport = getOrCreateTransporter();
  if (!transport) {
    console.error("[mail] SMTP is not configured (set SMTP_HOST, SMTP_USER, etc.)");
    return false;
  }
  const text = input.text?.trim() ? input.text : defaultPlainTextFromHtml(input.html);
  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text,
      html: input.html,
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mail] send error:", msg);
    return false;
  }
}

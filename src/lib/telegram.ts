/** HTML-экранирование для Telegram sendMessage (parse_mode HTML) */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  online: "онлайн",
  on_delivery: "при получении",
};

export type OrderItemForNotification = {
  title: string;
  price: number;
  quantity: number;
  product: { title: string } | null;
};

export type OrderForNotification = {
  id: string;
  email: string;
  phone: string;
  name: string;
  address: string;
  total: number;
  paymentMethod: string;
  promoCode: string | null;
};

/**
 * Сообщение о новом заказе (HTML). Все пользовательские поля экранируются.
 */
export function formatOrderNotification(
  order: OrderForNotification,
  items: OrderItemForNotification[]
): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const shortId = order.id.slice(-6);
  const adminUrl = `${baseUrl}/admin/orders/${order.id}`;
  const lineTitle = (it: OrderItemForNotification) => it.product?.title ?? it.title;
  const lines: string[] = [
    `🛒 Новый заказ #${shortId}`,
    "",
    `Телефон: ${escapeHtml(order.phone)}`,
    `Имя: ${escapeHtml(order.name)}`,
    `Email: ${escapeHtml(order.email)}`,
    `Адрес: ${escapeHtml(order.address)}`,
    "",
  ];
  for (const it of items) {
    const sub = it.price * it.quantity;
    const subStr = sub.toLocaleString("ru-RU");
    lines.push(`• ${escapeHtml(lineTitle(it))} × ${it.quantity} — ${subStr} ₽`);
  }
  const totalStr = order.total.toLocaleString("ru-RU");
  const methodLabel = PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod;
  lines.push(
    "",
    `Итого: ${totalStr} ₽`,
    `Способ оплаты: ${escapeHtml(methodLabel)}`
  );
  if (order.promoCode) {
    lines.push(`Промокод: ${escapeHtml(order.promoCode)}`);
  }
  lines.push("", `<a href="${escapeHtml(adminUrl)}">Админка: заказ</a>`);
  return lines.join("\n");
}

/** Сообщение о поступившей оплате (без HTML, только цифры/ид) */
export function formatPaymentReceivedText(orderId: string, totalRub: number): string {
  return `✅ Оплата получена по заказу #${orderId.slice(-6)} — ${totalRub.toLocaleString("ru-RU")} ₽`;
}

/**
 * Fire-and-forget: вызывайте через <code>void sendTelegramMessage(...)</code>, не await,
 * чтобы сбой/таймаут Telegram не задерживал HTTP-ответ.
 */
export async function sendTelegramMessage(
  text: string,
  opts?: { parseMode?: "HTML" | "MarkdownV2" }
): Promise<void> {
  const enabled = process.env.TELEGRAM_NOTIFY_ENABLED === "true";
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!enabled || !token || !chatId) {
    console.info(
      "[telegram] уведомления отключены (TELEGRAM_NOTIFY_ENABLED !== 'true' или нет токена/chat id)"
    );
    return;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };
  if (opts?.parseMode) {
    body.parse_mode = opts.parseMode;
  }
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        console.warn(`[telegram] sendMessage ${res.status}:`, errText.slice(0, 200));
      }
    } finally {
      clearTimeout(t);
    }
  } catch (e) {
    console.warn("[telegram] сеть/отмена sendMessage:", e);
  }
}

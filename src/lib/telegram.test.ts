import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  escapeHtml,
  formatOrderNotification,
  formatPaymentReceivedText,
  sendTelegramMessage,
} from "./telegram";

describe("formatOrderNotification", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("экранирует < > & в пользовательских полях", () => {
    const id = "clu00123456789abcdefghij";
    const text = formatOrderNotification(
      {
        id,
        email: "a&b<test@x.com",
        phone: "8 <900>",
        name: "Им <я>",
        address: "Адрес c &符号",
        total: 1000,
        paymentMethod: "online",
        promoCode: "A<B",
      },
      [
        { title: "P", price: 500, quantity: 2, product: { title: "Товар <x> &" } },
      ]
    );
    expect(text).toContain("a&amp;b&lt;test@x.com");
    expect(text).toContain("8 &lt;900&gt;");
    expect(text).toContain("Им &lt;я&gt;");
    expect(text).toContain("Адрес c &amp;符号");
    expect(text).toContain("A&lt;B");
    expect(text).toContain("• Товар &lt;x&gt; &amp; × 2");
    expect(text).not.toContain("Товар <x> &");
  });

  it("содержит номер заказа, позиции, итого, способ оплаты, ссылку на админку", () => {
    const id = "clorder1234567890abcdefghij";
    const t = formatOrderNotification(
      {
        id,
        email: "u@mail.ru",
        phone: "+1",
        name: "N",
        address: "A",
        total: 500,
        paymentMethod: "on_delivery",
        promoCode: null,
      },
      [{ title: "P1", price: 250, quantity: 2, product: { title: "P1" } }]
    );
    expect(t).toContain(`🛒 Новый заказ #${id.slice(-6)}`);
    expect(t).toContain("u@mail.ru");
    expect(t).toMatch(/•\s*P1 × 2/);
    expect(t).toContain("Итого: 500 ₽");
    expect(t).toContain("Способ оплаты: при получении");
    expect(t).toContain('href="https://example.com/admin/orders/');
    expect(t).toContain(id);
  });

  it("при наличии промокода выводит строку промокода", () => {
    const t = formatOrderNotification(
      {
        id: "clid1",
        email: "a@a.ru",
        phone: "1",
        name: "N",
        address: "A",
        total: 1,
        paymentMethod: "online",
        promoCode: "PROMO10",
      },
      []
    );
    expect(t).toContain("Промокод: PROMO10");
  });
});

describe("formatPaymentReceivedText", () => {
  it("форматирует id и сумму", () => {
    const oid = "x".repeat(10) + "LAST66";
    expect(oid.slice(-6)).toBe("LAST66");
    const n = 1234;
    const amount = n.toLocaleString("ru-RU");
    expect(formatPaymentReceivedText(oid, n)).toBe(
      `✅ Оплата получена по заказу #LAST66 — ${amount} ₽`
    );
  });
});

describe("escapeHtml", () => {
  it("заменяет <>&", () => {
    expect(escapeHtml(`a&b<c>`)).toBe("a&amp;b&lt;c&gt;");
  });
});

describe("sendTelegramMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /**
   * В POST /api/orders делаем void send — тут та же смысловая гарантия: сабмит ответа не ждёт
   * таймера 5 c; привязка: mock fetch никогда не resolve, сеть «мертва», весь await — Abort ~5s.
   * Роут вешает fire-and-forget, поэтому `expect(t1 - t0) < 2s` = до первого await в вызываемом
   * (запланирован 5s abort). Дополнительно: быстрый await целиком <2s при сразу успешном fetch.
   */
  it("сразу после старта (до сети) <2 c — void в API не ожидает fetch/TG", () => {
    vi.stubEnv("TELEGRAM_NOTIFY_ENABLED", "true");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "1");
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>(() => {
          /* «мертвый» TG */
        })
    );
    const t0 = performance.now();
    const p = sendTelegramMessage("m", { parseMode: "HTML" });
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(2000);
    void p;
  });

  it("при сразу успешном fetch полный await <2 c", async () => {
    vi.stubEnv("TELEGRAM_NOTIFY_ENABLED", "true");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "t");
    vi.stubEnv("TELEGRAM_CHAT_ID", "1");
    vi.stubGlobal("fetch", async () => {
      const toJson = async () => ({});
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "",
        json: toJson,
      } as unknown as Response;
    });
    const t0 = performance.now();
    await sendTelegramMessage("x", { parseMode: "HTML" });
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

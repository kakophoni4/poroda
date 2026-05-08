import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatPaymentReceivedText, sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Серверный callback all2pay / Альфа-Банк: подтверждение оплаты вместо опроса с фронта
 * (опрос `GET /api/payment/status` остаётся запасным).
 *
 * Формат: банк может прислать `application/x-www-form-urlencoded` или `application/json` с
 * плоскими полями — см.
 * [Callback notifications (checksum, operation, status, mdOrder, orderNumber)](https://doc.all2pay.net/integration/router/router-callbacks.html)
 *
 * HMAC (ключ `ALFABANK_CALLBACK_SECRET`, в callback передаётся `checksum`):
 * без секрета в .env `PaymentEvent.signatureValid` — `false`, даже если `checksum` от банка
 * валиден. Алгоритм (router-callbacks all2pay):
 * 1) исключить `checksum` (и при появлении `signAlias` / `sign_alias` — тоже);
 * 2) пары `имя;значение;` в алфавитном порядке **имён**;
 * 3) HMAC-SHA256(UTF-8) от этой строки с общим с банком секретом, hex, **верхний регистр**;
 * 4) сравнить с `checksum` (timing-safe).
 * Если `ALFABANK_CALLBACK_SECRET` не задан в `.env` — пишем `signatureValid: false` и
 * **не** полагаемся на подпись, но бизнес-логика выполняется (только dev / пока нет ключа);
 * если секрет задан, а подписи нет или она неверна — в БД только `PaymentEvent`, заказ не меняем.
 *
 * Успешная списание/оплата: в типичном one-step `operation === "deposited" && String(status) === "1"`.
 * `operation === "approved" && status === 1` — удержание (2-step / предавторизация) → `pending` до `deposited`+1.
 * `refunded` / `reversed` / `declinedByTimeout` / `declinedCardPresent` — см. таблицу `operation` в доке.
 */
const OK = () =>
  new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

const SIGN_EXCLUDE = new Set(["checksum", "signalias", "sign_alias"]);

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function jsonToStringMap(v: unknown): Record<string, string> {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = valueToString(val);
  }
  return out;
}

function buildHmacString(params: Record<string, string>): string {
  const entries = Object.entries(params).filter(
    ([k]) => !SIGN_EXCLUDE.has(k.toLowerCase())
  );
  entries.sort((a, b) => a[0].localeCompare(b[0], "en"));
  return entries.map(([k, v]) => `${k};${v};`).join("");
}

function getParam(params: Record<string, string>, name: string): string | undefined {
  const nl = name.toLowerCase();
  for (const [k, v] of Object.entries(params)) {
    if (k.toLowerCase() === nl) return v;
  }
  return undefined;
}

type SymmetricVerify = { signatureValid: boolean; skipBecauseNoSecret: boolean };

/**
 * HMAC-SHA256 по спецификации all2pay (router-callbacks).
 * `skipBecauseNoSecret: true` — ключа в env нет, подпись не требуем, заказ обрабатывать можно.
 * При наличии ключа и сбойной подписи — `signatureValid: false`, `skipBecauseNoSecret: false`.
 */
function verifySymmetricChecksum(
  params: Record<string, string>,
  providedChecksum: string | undefined,
  secret: string | undefined
): SymmetricVerify {
  const s = secret?.trim();
  if (!s) {
    return { signatureValid: false, skipBecauseNoSecret: true };
  }
  if (!providedChecksum) {
    return { signatureValid: false, skipBecauseNoSecret: false };
  }
  const digest = createHmac("sha256", s)
    .update(buildHmacString(params), "utf8")
    .digest("hex")
    .toUpperCase();
  const expected = providedChecksum.trim().toUpperCase();
  if (expected.length !== 64 || digest.length !== 64) {
    return { signatureValid: false, skipBecauseNoSecret: false };
  }
  if (!/^[0-9A-F]{64}$/u.test(digest) || !/^[0-9A-F]{64}$/u.test(expected)) {
    return { signatureValid: false, skipBecauseNoSecret: false };
  }
  try {
    return {
      signatureValid: timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(expected, "hex")),
      skipBecauseNoSecret: false,
    };
  } catch {
    return { signatureValid: false, skipBecauseNoSecret: false };
  }
}

type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

/**
 * `status` в callback: "1" успех операции, "0" — нет (см. doc all2pay).
 * `null` — ничего не меняем в заказе; `ignore` — логируем, заказ не трогаем.
 */
function mapOpToStatus(
  operation: string | undefined,
  statusRaw: string | undefined
): PaymentStatus | "ignore" | null {
  const op = (operation || "").toLowerCase();
  if (!op) return null;
  const s = (statusRaw ?? "").trim() === "1" ? 1 : 0;

  if (op === "bindingcreated" || op === "bindingactivitychanged") return "ignore";
  if (op === "deposited") return s === 1 ? "paid" : "failed";
  if (op === "approved") return s === 1 ? "pending" : "failed";
  if (op === "refunded") return s === 1 ? "refunded" : "failed";
  if (op === "reversed") return "failed";
  if (op === "declinedbytimeout" || op === "declinedcardpresent") return "failed";
  return null;
}

function getBankOrderId(p: Record<string, string>): string | undefined {
  return (
    getParam(p, "mdOrder") ||
    getParam(p, "orderId") ||
    (() => {
      for (const [k, v] of Object.entries(p)) {
        if (k.toLowerCase() === "mdorder" && v) return v;
      }
      return undefined;
    })()
  );
}

async function parseRequestPayload(request: NextRequest): Promise<Record<string, string>> {
  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      return jsonToStringMap(await request.json());
    }
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const o: Record<string, string> = {};
      for (const [k, v] of form.entries()) {
        if (typeof v === "string") o[k] = v;
      }
      return o;
    }
    const text = (await request.text()).trim();
    if (!text) return {};
    if (text.startsWith("{")) {
      return jsonToStringMap(JSON.parse(text) as unknown);
    }
    const search = new URLSearchParams(text);
    const o: Record<string, string> = {};
    search.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  } catch (e) {
    console.error("payment/webhook parse body:", e);
    return {};
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.ALFABANK_CALLBACK_SECRET;
  if (!secret?.trim()) {
    console.warn("payment/webhook: ALFABANK_CALLBACK_SECRET не задан — callback принимается без проверки подписи (signatureValid=false).");
  }

  try {
    const raw = (await parseRequestPayload(request)) as Record<string, string>;
    const providedChecksum = getParam(raw, "checksum");
    const { signatureValid, skipBecauseNoSecret: skip } = verifySymmetricChecksum(
      raw,
      providedChecksum,
      secret
    );
    const ev = !skip && signatureValid;
    if (!skip && !signatureValid) {
      await prisma.paymentEvent.create({
        data: {
          orderId: null,
          paymentId: getBankOrderId(raw) ?? null,
          rawPayload: raw,
          signatureValid: false,
          status: "rejected_invalid_signature",
        },
      });
      return OK();
    }

    const md = getBankOrderId(raw);
    const orderNumber = getParam(raw, "orderNumber");
    const op = getParam(raw, "operation");
    const st = getParam(raw, "status");
    const mapped = mapOpToStatus(op, st);

    const order =
      (orderNumber
        ? await prisma.order.findUnique({
            where: { id: orderNumber },
            select: {
              id: true,
              userId: true,
              promoId: true,
              paymentId: true,
              paymentStatus: true,
              paymentMethod: true,
              total: true,
            },
          })
        : null) ??
      (md
        ? await prisma.order.findFirst({
            where: { paymentId: md },
            select: {
              id: true,
              userId: true,
              promoId: true,
              paymentId: true,
              paymentStatus: true,
              paymentMethod: true,
              total: true,
            },
          })
        : null);

    if (mapped === "ignore" || mapped === null) {
      await prisma.paymentEvent.create({
        data: {
          orderId: order?.id ?? null,
          paymentId: md ?? null,
          rawPayload: raw,
          signatureValid: ev,
          status: mapped === "ignore" ? "ignored" : "unmapped_operation",
        },
      });
      return OK();
    }
    if (!order) {
      await prisma.paymentEvent.create({
        data: {
          orderId: null,
          paymentId: md ?? null,
          rawPayload: raw,
          signatureValid: ev,
          status: "order_not_found",
        },
      });
      return OK();
    }

    const online = order.paymentMethod === "online";

    if (mapped === "paid" && order.paymentStatus === "paid") {
      await prisma.paymentEvent.create({
        data: {
          orderId: order.id,
          paymentId: md ?? null,
          rawPayload: raw,
          signatureValid: ev,
          status: "paid_idempotent",
        },
      });
      return OK();
    }

    if (online && order.paymentId && md && order.paymentId !== md) {
      await prisma.paymentEvent.create({
        data: {
          orderId: order.id,
          paymentId: md,
          rawPayload: raw,
          signatureValid: ev,
          status: "mismatch_bank_order_id",
        },
      });
      return OK();
    }

    if (mapped === "pending") {
      if (online) {
        await prisma.$transaction(async (tx) => {
          if (order.paymentStatus !== "paid" && order.paymentStatus !== "refunded") {
            await tx.order.update({
              where: { id: order.id },
              data: { paymentStatus: "pending", paymentCheckedAt: new Date() },
            });
          }
          await tx.paymentEvent.create({
            data: {
              orderId: order.id,
              paymentId: md ?? null,
              rawPayload: raw,
              signatureValid: ev,
              status: "pending",
            },
          });
        });
      } else {
        await prisma.paymentEvent.create({
          data: {
            orderId: order.id,
            paymentId: md ?? null,
            rawPayload: raw,
            signatureValid: ev,
            status: "skipped_non_online_order",
          },
        });
      }
      return OK();
    }

    if (mapped === "failed" || mapped === "refunded") {
      if (online) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: mapped, paymentCheckedAt: new Date() },
          });
          await tx.paymentEvent.create({
            data: {
              orderId: order.id,
              paymentId: md ?? null,
              rawPayload: raw,
              signatureValid: ev,
              status: mapped,
            },
          });
        });
      } else {
        await prisma.paymentEvent.create({
          data: {
            orderId: order.id,
            paymentId: md ?? null,
            rawPayload: raw,
            signatureValid: ev,
            status: "skipped_non_online_order",
          },
        });
      }
      return OK();
    }

    if (mapped === "paid" && !online) {
      await prisma.paymentEvent.create({
        data: {
          orderId: order.id,
          paymentId: md ?? null,
          rawPayload: raw,
          signatureValid: ev,
          status: "skipped_non_online_order",
        },
      });
      return OK();
    }

    if (mapped === "paid" && online) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "paid", paymentCheckedAt: new Date() },
        });
        if (order.promoId) {
          const exists = await tx.promoUse.findFirst({
            where: { promoId: order.promoId, orderId: order.id },
          });
          if (!exists) {
            if (order.userId) {
              await tx.promoUse.create({
                data: {
                  promoId: order.promoId,
                  userId: order.userId,
                  orderId: order.id,
                },
              });
            }
            const after = await tx.promo.update({
              where: { id: order.promoId },
              data: { usedCount: { increment: 1 } },
              select: { usedCount: true, maxUses: true, code: true },
            });
            if (after.maxUses != null && after.usedCount > after.maxUses) {
              console.warn(
                `[payment/webhook] usedCount > maxUses after paid for promo ${after.code} (order ${order.id.slice(0, 8)}…), order remains paid.`
              );
            }
          }
        }
        if (order.userId) {
          await tx.userNotification.create({
            data: { userId: order.userId, title: "Оплата получена", body: "Оплата получена" },
          });
        }
        await tx.paymentEvent.create({
          data: {
            orderId: order.id,
            paymentId: md ?? null,
            rawPayload: raw,
            signatureValid: ev,
            status: "paid",
          },
        });
      });
      try {
        void sendTelegramMessage(formatPaymentReceivedText(order.id, order.total));
      } catch (e) {
        console.warn("Telegram: уведомление об оплате:", e);
      }
      return OK();
    }

    await prisma.paymentEvent.create({
      data: {
        orderId: order.id,
        paymentId: md ?? null,
        rawPayload: raw,
        signatureValid: ev,
        status: "not_applied",
      },
    });
  } catch (e) {
    console.error("payment/webhook:", e);
  }
  return OK();
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAlfabankGateway } from "@/lib/alfabank-gateway";

/**
 * Опрос GET статуса оплаты в Альфа-Банке (резерв, если server callback задержан).
 * Основное подтверждение — `POST /api/payment/webhook` (см. тот маршрут).
 *
 * Доступ:
 *   - админ;
 *   - залогиненный владелец заказа;
 *   - пользователь со ссылкой ?rt=<reviewToken> (страница «Спасибо»).
 *
 * Маппинг Альфа-Банк → внутренние статусы:
 *   0 — зарегистрирован, не оплачен → pending
 *   1 — предавторизован → pending
 *   2 — авторизован/оплачен → paid
 *   3 — отменён → failed
 *   4 — возврат → refunded
 *   5 — инициирована 3-D Secure → pending
 *   6 — отклонён → failed
 */
const STATUS_MAP: Record<number, "pending" | "paid" | "failed" | "refunded"> = {
  0: "pending",
  1: "pending",
  2: "paid",
  3: "failed",
  4: "refunded",
  5: "pending",
  6: "failed",
};

const STATUS_LABEL: Record<string, string> = {
  unpaid: "Не оплачен",
  pending: "Ожидаем подтверждения банка",
  paid: "Оплачен",
  failed: "Оплата не прошла",
  refunded: "Возврат",
};

const POLL_THROTTLE_MS = 5_000;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  const rt = url.searchParams.get("rt")?.trim() || null;
  if (!orderId) {
    return NextResponse.json({ error: "Нужен orderId" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      paymentId: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentCheckedAt: true,
      reviewToken: true,
      total: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const adminSession = await getAdminSession();
  const userSession = await getUserSession();
  const ownerOk = !!userSession?.userId && userSession.userId === order.userId;
  const tokenOk = !!rt && !!order.reviewToken && rt === order.reviewToken;
  if (!adminSession && !ownerOk && !tokenOk) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const respond = (status: string) =>
    NextResponse.json({
      paymentMethod: order.paymentMethod,
      paymentStatus: status,
      paymentStatusLabel: STATUS_LABEL[status] ?? status,
      total: order.total,
      checkedAt: order.paymentCheckedAt,
    });

  /** Опрашивать банк имеет смысл только для онлайн-оплаты с зарегистрированным paymentId. */
  if (order.paymentMethod !== "online" || !order.paymentId) {
    return respond(order.paymentStatus);
  }
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    return respond(order.paymentStatus);
  }

  /** Не дёргаем банк чаще раза в 5 секунд на заказ. */
  const now = Date.now();
  const last = order.paymentCheckedAt ? order.paymentCheckedAt.getTime() : 0;
  if (now - last < POLL_THROTTLE_MS) {
    return respond(order.paymentStatus);
  }

  const userName = process.env.ALFABANK_USERNAME;
  const password = process.env.ALFABANK_PASSWORD;
  const baseUrl = process.env.ALFABANK_API_URL;
  if (!userName || !password || !baseUrl) {
    return respond(order.paymentStatus);
  }

  try {
    const gw = getAlfabankGateway(baseUrl);
    const statusBody =
      gw === "rbs"
        ? new URLSearchParams({
            userName,
            password,
            orderId: order.paymentId,
            language: "ru",
          }).toString()
        : JSON.stringify({
            userName,
            password,
            orderId: order.paymentId,
            language: "ru",
          });
    const res = await fetch(`${baseUrl}/getOrderStatusExtended.do`, {
      method: "POST",
      headers:
        gw === "rbs"
          ? { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }
          : { "Content-Type": "application/json" },
      body: statusBody,
    });
    const data = (await res.json()) as {
      orderStatus?: number;
      errorCode?: string | number;
      errorMessage?: string;
    };
    const errCode = data.errorCode;
    const hasErr =
      errCode !== undefined && errCode !== null && String(errCode) !== "0";
    if (hasErr && data.orderStatus == null) {
      /** Просто помечаем время опроса, статус не меняем. */
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentCheckedAt: new Date() },
      });
      return respond(order.paymentStatus);
    }
    const mapped =
      typeof data.orderStatus === "number" ? STATUS_MAP[data.orderStatus] : undefined;
    const newStatus = mapped ?? order.paymentStatus;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newStatus,
        paymentCheckedAt: new Date(),
      },
    });
    return respond(newStatus);
  } catch (e) {
    console.error("payment/status:", e);
    return respond(order.paymentStatus);
  }
}

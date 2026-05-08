import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import {
  buildOrderBundleJson,
  buildOrderItemLines,
  mapTaxSystemToCode,
  type AlfabankFfdConfig,
} from "@/lib/alfabank-ffd";
import { getAlfabankGateway } from "@/lib/alfabank-gateway";

function registerPayloadFailed(data: { errorCode?: string | number | null }): boolean {
  const ec = data.errorCode;
  if (ec === undefined || ec === null) return false;
  return String(ec) !== "0";
}

function buildRegisterHttpBody(
  gw: ReturnType<typeof getAlfabankGateway>,
  payload: Record<string, unknown>
): { headers: HeadersInit; body: BodyInit } {
  if (gw === "rbs") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue;
      if (key === "callbackUrl") continue;
      const encoded =
        key === "orderBundle" || typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
      params.append(key, encoded);
    }
    return {
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: params.toString(),
    };
  }
  return {
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(payload),
  };
}

/**
 * Регистрация заказа в Альфа-Банк (эквайринг).
 *
 * Два варианта по `ALFABANK_API_URL`:
 * - all2pay — JSON: https://doc.all2pay.net/integration/router/alfa-api.html
 * - RBS REST (тест `alfa.rbsuat.com`) — form-urlencoded:
 *   https://alfa.rbsuat.com/sandbox/ru/integration/api/rest.html
 *
 * Колбек: all2pay — `callbackUrl`; RBS — `dynamicCallbackUrl`.
 *
 * Сумма к оплате — из БД (Order.total). Чек — orderBundle + taxSystem.
 */
const getConfig = () => {
  const ffd: AlfabankFfdConfig = {
    taxSystem: process.env.ALFABANK_TAX_SYSTEM ?? "usn_income",
    vatType: process.env.ALFABANK_VAT_TYPE ?? "none",
    deliveryVatType: process.env.ALFABANK_DELIVERY_VAT_TYPE ?? "none",
    paymentMethod: process.env.ALFABANK_PAYMENT_METHOD ?? "full_prepayment",
    paymentObject: process.env.ALFABANK_PAYMENT_OBJECT ?? "commodity",
    deliveryPaymentObject: process.env.ALFABANK_DELIVERY_PAYMENT_OBJECT ?? "service",
    ffdVersion: process.env.ALFABANK_FFD_VERSION ?? "1.2",
  };
  return {
    userName: process.env.ALFABANK_USERNAME,
    password: process.env.ALFABANK_PASSWORD,
    clientId: process.env.ALFABANK_CLIENT_ID,
    baseUrl: process.env.ALFABANK_API_URL,
    ffd,
  };
};

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const { userName, password, clientId, baseUrl, ffd } = getConfig();
  const gw = baseUrl ? getAlfabankGateway(baseUrl) : "rbs";

  if (!userName || !password) {
    return NextResponse.json(
      {
        error:
          "Онлайн-оплата временно недоступна: задайте ALFABANK_USERNAME и ALFABANK_PASSWORD в .env (см. .env.example).",
      },
      { status: 503 }
    );
  }
  if (!baseUrl) {
    return NextResponse.json(
      {
        error:
          "Не задан ALFABANK_API_URL (напр. тест RBS https://alfa.rbsuat.com/payment/rest или all2pay).",
      },
      { status: 503 }
    );
  }

  let body: {
    orderNumber?: string;
    returnUrl?: string;
    description?: string;
    reviewToken?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const { orderNumber, returnUrl, description, reviewToken } = body;
  if (!orderNumber || !returnUrl) {
    return NextResponse.json({ error: "Нужны orderNumber и returnUrl" }, { status: 400 });
  }

  const session = await getUserSession();
  const order = await prisma.order.findUnique({
    where: { id: orderNumber },
    include: { items: { include: { product: { select: { title: true } } } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }
  const ownerOk = !!session?.userId && session.userId === order.userId;
  const tokenOk = !!reviewToken && !!order.reviewToken && reviewToken === order.reviewToken;
  if (!ownerOk && !tokenOk) {
    return NextResponse.json({ error: "Нет доступа к заказу" }, { status: 403 });
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Заказ уже оплачен", paymentStatus: "paid" }, { status: 409 });
  }
  if (order.total <= 0) {
    return NextResponse.json({ error: "Некорректная сумма заказа" }, { status: 400 });
  }
  if (!order.items || order.items.length === 0) {
    return NextResponse.json(
      { error: "В заказе нет позиций — нельзя сформировать чек" },
      { status: 400 }
    );
  }

  const amountKop = Math.round(order.total * 100);

  const orderItemsForBundle = order.items.map((it) => ({
    productTitle: (it.product?.title ?? it.title).trim() || "Товар",
    price: it.price,
    quantity: it.quantity,
  }));

  const lines = buildOrderItemLines(orderItemsForBundle, amountKop);
  if (lines.length === 0) {
    return NextResponse.json(
      { error: "Невозможно сформировать чек: нет товарных позиций" },
      { status: 500 }
    );
  }
  const lineSumKop = lines.reduce((s, l) => s + l.unitPriceKop * l.quantity, 0);
  if (lineSumKop !== amountKop) {
    console.error(
      "payment/create: lineSumKop !== amountKop",
      lineSumKop,
      amountKop
    );
    return NextResponse.json(
      { error: "Сумма строк чека не совпадает с оплатой — обратитесь в поддержку" },
      { status: 500 }
    );
  }

  const orderBundle = buildOrderBundleJson(lines, ffd);
  // RBS REST (alfa.rbsuat.com/payment/rest) не принимает поле ffdVersion в orderBundle (ошибка parsing).
  if (gw === "rbs" && orderBundle && typeof orderBundle === "object") {
    delete (orderBundle as Record<string, unknown>).ffdVersion;
    // Приводим корзину к формату RBS REST:
    // - tax — объект { taxType }, а не поле taxType на уровне позиции (в этой среде taxType не принимается)
    // - без itemCurrency (валюта задаётся параметром currency запроса)
    const cartItems = (orderBundle as Record<string, unknown>).cartItems as
      | { items?: unknown[] }
      | undefined;
    const items = Array.isArray(cartItems?.items) ? cartItems?.items : null;
    if (items) {
      for (const raw of items) {
        if (!raw || typeof raw !== "object") continue;
        const it = raw as Record<string, unknown>;
        if (it.itemCurrency !== undefined) delete it.itemCurrency;
        // RBS REST требует обязательный itemCode на позиции.
        if (it.itemCode === undefined || it.itemCode === null || String(it.itemCode).trim() === "") {
          const pid = it.positionId !== undefined ? String(it.positionId) : String(Math.random()).slice(2);
          it.itemCode = `pos-${pid}`;
        }
        // Гарантируем наличие tax:{taxType}
        let taxType: unknown = undefined;
        if (it.tax && typeof it.tax === "object") {
          taxType = (it.tax as Record<string, unknown>).taxType;
        }
        if (taxType === undefined && it.taxType !== undefined) {
          taxType = it.taxType;
        }
        if (it.taxType !== undefined) delete it.taxType;
        if (taxType !== undefined) {
          it.tax = { taxType };
        } else if (it.tax !== undefined) {
          delete it.tax;
        }
      }
    }
  }
  const taxSystem = mapTaxSystemToCode(ffd.taxSystem);

  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const allowRbsDynamicCallback =
    gw === "rbs" &&
    siteBase.startsWith("https://") &&
    !/^https:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(siteBase);

  try {
    const registerPayload: Record<string, unknown> = {
      orderNumber: order.id,
      amount: amountKop,
      // В RBS REST часто используется старый числовой код RUB = 810.
      currency: gw === "rbs" ? "810" : "643",
      language: "ru",
      returnUrl,
      description: description?.slice(0, 240),
      userName,
      password,
      orderBundle,
      taxSystem,
      ...(clientId ? { clientId } : {}),
    };
    if (siteBase) {
      if (gw === "rbs") {
        // RBS REST отклоняет dynamicCallbackUrl на localhost и/или без https.
        // Для локальной разработки работаем через polling `/api/payment/status`.
        if (allowRbsDynamicCallback) {
          registerPayload.dynamicCallbackUrl = `${siteBase}/api/payment/webhook`;
        }
      } else {
        registerPayload.callbackUrl = `${siteBase}/api/payment/webhook`;
      }
    }

    if (process.env.PAYMENT_DEBUG_LOG_REGISTER === "1") {
      const safe = { ...registerPayload, password: "***" };
      console.log(`[payment/create] register.do (${gw}):`, JSON.stringify(safe));
    }

    const { headers: registerHeaders, body: registerBody } = buildRegisterHttpBody(
      gw,
      registerPayload
    );

    let registerRes: Response;
    try {
      registerRes = await fetch(`${baseUrl}/register.do`, {
        method: "POST",
        headers: registerHeaders,
        body: registerBody,
      });
    } catch (networkErr) {
      console.error("[payment/create] network error to register.do:", networkErr);
      return NextResponse.json(
        { error: "Не удалось связаться с платёжным шлюзом (сеть)." },
        { status: 502 }
      );
    }

    const registerRaw = await registerRes.text();
    if (process.env.PAYMENT_DEBUG_LOG_REGISTER === "1") {
      console.log(
        "[payment/create] register.do http status:",
        registerRes.status,
        "body:",
        registerRaw.slice(0, 2000)
      );
    }
    let registerData: {
      errorCode?: string | number;
      formUrl?: string;
      orderId?: string;
      orderNumber?: string;
      errorMessage?: string;
    } = {};
    try {
      registerData = registerRaw ? JSON.parse(registerRaw) : {};
    } catch {
      console.error(
        "[payment/create] non-JSON response from register.do (status",
        registerRes.status,
        "):",
        registerRaw.slice(0, 500)
      );
      return NextResponse.json(
        {
          error:
            "Платёжный шлюз вернул некорректный ответ (не JSON). Подробности в логах сервера.",
        },
        { status: 502 }
      );
    }

    if (registerPayloadFailed(registerData)) {
      console.error(
        "[payment/create] bank error:",
        "errorCode=",
        registerData.errorCode,
        "errorMessage=",
        registerData.errorMessage
      );
      return NextResponse.json(
        { error: registerData.errorMessage || "Ошибка регистрации заказа в платёжном шлюзе" },
        { status: 502 }
      );
    }

    const gatewayOrderId = registerData.orderId;
    if (!gatewayOrderId) {
      console.error("[payment/create] no orderId in response:", registerData);
      return NextResponse.json({ error: "Платёжный шлюз не вернул orderId" }, { status: 502 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: gatewayOrderId,
        paymentStatus: "pending",
      },
    });

    if (gw === "all2pay") {
      try {
        const alfaRes = await fetch(`${baseUrl}/alfapay/paymentOrder.do`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: "ru",
            orderId: gatewayOrderId,
            userName,
            password,
          }),
        });
        const alfaData = (await alfaRes.json()) as {
          success?: boolean;
          data?: { orderId?: string; redirect?: string };
        };

        if (alfaData.success && alfaData.data?.redirect) {
          return NextResponse.json({
            paymentId: alfaData.data.orderId ?? gatewayOrderId,
            confirmationUrl: alfaData.data.redirect,
            amount: order.total,
          });
        }
      } catch (secondStepErr) {
        console.warn("[payment/create] alfapay/paymentOrder.do не удалось:", secondStepErr);
      }
    }

    return NextResponse.json({
      paymentId: gatewayOrderId,
      confirmationUrl: registerData.formUrl,
      amount: order.total,
      message: registerData.formUrl ? undefined : "Не удалось получить ссылку для оплаты",
    });
  } catch (e) {
    console.error("Payment create error:", e);
    return NextResponse.json({ error: "Ошибка платёжного сервиса" }, { status: 500 });
  }
}

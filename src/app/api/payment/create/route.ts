import { NextRequest, NextResponse } from "next/server";

/**
 * Шаблон оплаты через Альфа-Банк (Alfa Pay / эквайринг).
 * Документация: https://doc.all2pay.net/integration/router/alfa-api.html
 * 1) register.do — регистрация заказа, получение orderId
 * 2) alfapay/paymentOrder.do — получение ссылки для редиректа на страницу оплаты
 *
 * В .env задайте: ALFABANK_USERNAME, ALFABANK_PASSWORD, ALFABANK_CLIENT_ID
 * Опционально: ALFABANK_API_URL (по умолчанию uat: https://api.uat.all2pay.net/v1)
 */
const getConfig = () => ({
  userName: process.env.ALFABANK_USERNAME,
  password: process.env.ALFABANK_PASSWORD,
  clientId: process.env.ALFABANK_CLIENT_ID,
  baseUrl: process.env.ALFABANK_API_URL || "https://api.uat.all2pay.net/v1",
});

export async function POST(request: NextRequest) {
  const { userName, password, clientId, baseUrl } = getConfig();

  if (!userName || !password) {
    return NextResponse.json(
      { error: "Оплата не настроена. Задайте ALFABANK_USERNAME и ALFABANK_PASSWORD в .env" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { orderNumber, amount, returnUrl, description } = body as {
      orderNumber: string;
      amount: number;
      returnUrl: string;
      description?: string;
    };

    if (!orderNumber || amount <= 0 || !returnUrl) {
      return NextResponse.json(
        { error: "Нужны orderNumber, amount (в копейках или рублях — уточните в договоре), returnUrl" },
        { status: 400 }
      );
    }

    const amountKop = Math.round(amount * 100);

    const registerPayload = {
      orderNumber,
      amount: amountKop,
      currency: "643",
      language: "ru",
      returnUrl,
      userName,
      password,
      ...(clientId && { clientId }),
    };

    const registerRes = await fetch(`${baseUrl}/register.do`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerPayload),
    });
    const registerData = (await registerRes.json()) as {
      errorCode?: string;
      formUrl?: string;
      orderId?: string;
      orderNumber?: string;
      errorMessage?: string;
    };

    if (registerData.errorCode && registerData.errorCode !== "0") {
      return NextResponse.json(
        { error: registerData.errorMessage || "Ошибка регистрации заказа в платёжном шлюзе" },
        { status: 502 }
      );
    }

    const gatewayOrderId = registerData.orderId;
    if (!gatewayOrderId) {
      return NextResponse.json(
        { error: "Платёжный шлюз не вернул orderId" },
        { status: 502 }
      );
    }

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
        paymentId: alfaData.data.orderId,
        confirmationUrl: alfaData.data.redirect,
      });
    }

    return NextResponse.json({
      paymentId: gatewayOrderId,
      confirmationUrl: registerData.formUrl || undefined,
      message: "Используйте formUrl для редиректа, если alfapay не вернул redirect",
    });
  } catch (e) {
    console.error("Payment create error:", e);
    return NextResponse.json({ error: "Ошибка платёжного сервиса" }, { status: 500 });
  }
}

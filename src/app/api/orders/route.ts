import { randomBytes } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { applyPromoToTotal } from "@/lib/apply-promo";
import { getAdminSession, getUserSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { orderStatusLabel } from "@/lib/order-status";
import { formatOrderNotification, sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  const adminSession = await getAdminSession();
  if (adminSession) {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { slug: true, title: true } } } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    return NextResponse.json(orders);
  }
  const userSession = await getUserSession();
  if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: userSession.userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { slug: true } } } },
      review: { select: { id: true, status: true } },
    },
  });
  return NextResponse.json(orders);
}

type IncomingItem = { productId: string; quantity: number };

const MAX_QUANTITY_PER_ITEM = 50;
const MAX_LINES = 30;

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  try {
    const body = await request.json();
    const { email, phone, name, address, items, promoCode, paymentMethod } = body as {
      email?: string;
      phone?: string;
      name?: string;
      address?: string;
      items?: unknown;
      promoCode?: string;
      paymentMethod?: string;
    };
    const paymentMethodNorm: "online" | "on_delivery" =
      paymentMethod === "on_delivery" ? "on_delivery" : "online";
    if (!email?.trim() || !phone?.trim() || !name?.trim() || !address?.trim()) {
      return NextResponse.json({ error: "Не заполнены обязательные поля" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
    }
    if (items.length > MAX_LINES) {
      return NextResponse.json({ error: `Слишком много позиций в заказе (максимум ${MAX_LINES})` }, { status: 400 });
    }

    /** Нормализуем входящие позиции: только productId + quantity, всё остальное — из БД. */
    const cleanItems: IncomingItem[] = [];
    const idsSet = new Set<string>();
    for (const raw of items) {
      const obj = raw as { productId?: unknown; quantity?: unknown };
      const productId = typeof obj.productId === "string" ? obj.productId.trim() : "";
      const qty = Number(obj.quantity);
      if (!productId) {
        return NextResponse.json({ error: "Некорректный товар в корзине" }, { status: 400 });
      }
      if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json(
          { error: `Некорректное количество товара (1–${MAX_QUANTITY_PER_ITEM})` },
          { status: 400 }
        );
      }
      cleanItems.push({ productId, quantity: Math.floor(qty) });
      idsSet.add(productId);
    }

    /** Тянем актуальные карточки. Цена и наличие — только из БД, клиент не управляет ими. */
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(idsSet) } },
      select: { id: true, title: true, price: true, inStock: true, archivedAt: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    /** Сворачиваем строки с одинаковым productId, чтобы не было дублей. */
    const merged = new Map<string, number>();
    for (const it of cleanItems) {
      merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
    }

    let subtotal = 0;
    const orderItemsCreate: { productId: string; title: string; price: number; quantity: number }[] = [];
    const outOfStock: string[] = [];
    for (const [productId, quantity] of merged) {
      const product = productById.get(productId);
      if (!product) {
        return NextResponse.json(
          { error: `Товар недоступен (id ${productId.slice(0, 6)}…). Обновите корзину.` },
          { status: 400 }
        );
      }
      if (product.archivedAt != null) {
        return NextResponse.json(
          { error: `Позиция «${product.title}» снята с витрины. Уберите её из корзины и обновите каталог.` },
          { status: 400 }
        );
      }
      if (!product.inStock) {
        outOfStock.push(product.title);
        continue;
      }
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json(
          { error: `Слишком большое количество для «${product.title}»` },
          { status: 400 }
        );
      }
      subtotal += product.price * quantity;
      orderItemsCreate.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity,
      });
    }
    if (outOfStock.length > 0) {
      return NextResponse.json(
        {
          error: `Закончились в наличии: ${outOfStock.join(", ")}. Обновите корзину.`,
          outOfStock,
        },
        { status: 409 }
      );
    }
    if (orderItemsCreate.length === 0) {
      return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();
    const userSession = await getUserSession();
    /** Привязываем заказ к аккаунту, если email формы совпадает с email профиля. */
    let orderUserId: string | null = null;
    if (userSession?.userId) {
      const account = await prisma.user.findUnique({
        where: { id: userSession.userId },
        select: { email: true },
      });
      if (account?.email.trim().toLowerCase() === emailNorm) {
        orderUserId = userSession.userId;
      }
    }

    /**
     * on_delivery: сразу атомарно «бронируем» промо (updateMany + increment usedCount) и
     * привязываем к пользователю через PromoUse — ручная оплата привоза позже, лимит уже взят.
     *
     * online: promo только проверяем (applyPromoToTotal) и пишем promoId на заказ, без increment
     * и без PromoUse — usedCount + PromoUse в webhook/callback на фактическую оплату.
     *
     * Про online и гонки: снимок usedCount/maxUses не атомарен с банковской оплатой, две сессии могли
     * оформить беспечный к последнему «слоту» заказ. Оба останутся с скидкой; при `paid` webhook
     * догоняет usedCount, при usedCount &gt; maxUses пишем warning — заказ всё равно остаётся paid.
     */
    const codeRaw = promoCode?.toUpperCase().trim() || null;

    if (paymentMethodNorm === "online" && userSession?.userId) {
      const authUser = await prisma.user.findUnique({
        where: { id: userSession.userId },
        select: { emailVerifiedAt: true },
      });
      if (authUser?.emailVerifiedAt == null) {
        const previewTotal = await previewFinalTotalForOrder(subtotal, codeRaw);
        if (previewTotal >= 1000) {
          const msg = "Подтвердите email в личном кабинете, чтобы оформить онлайн-оплату";
          return NextResponse.json({ error: msg, msg }, { status: 403 });
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let promoIdLocal: string | null = null;
      let finalTotalLocal = subtotal;
      let promoCodeStored: string | null = null;

      if (codeRaw) {
        const promo = await tx.promo.findFirst({
          where: { code: codeRaw, active: true },
          select: {
            id: true,
            code: true,
            percent: true,
            discountRub: true,
            maxUses: true,
            usedCount: true,
            validFrom: true,
            validTo: true,
            active: true,
            minOrderTotal: true,
          },
        });
        if (promo) {
          const applied = applyPromoToTotal(subtotal, promo);
          if (applied.ok) {
            if (paymentMethodNorm === "on_delivery") {
              const reserved = await tx.promo.updateMany({
                where: {
                  id: promo.id,
                  active: true,
                  OR: [
                    { maxUses: null },
                    { usedCount: { lt: promo.maxUses ?? Number.MAX_SAFE_INTEGER } },
                  ],
                },
                data: { usedCount: { increment: 1 } },
              });
              if (reserved.count === 1) {
                promoIdLocal = promo.id;
                finalTotalLocal = applied.finalTotal;
                promoCodeStored = promo.code;
              }
            } else {
              /** online: только валидация, без increment — квота списывается в payment/webhook при `paid` */
              promoIdLocal = promo.id;
              finalTotalLocal = applied.finalTotal;
              promoCodeStored = promo.code;
            }
          }
        }
      }

      finalTotalLocal = Math.max(0, Math.round(finalTotalLocal));

      const order = await tx.order.create({
        data: {
          userId: orderUserId,
          email: emailNorm,
          phone: phone.trim(),
          name: name.trim(),
          address: address.trim(),
          status: "placed",
          promoCode: promoCodeStored,
          promoId: promoIdLocal,
          paymentMethod: paymentMethodNorm,
          paymentStatus: "unpaid",
          total: finalTotalLocal,
          reviewToken: randomBytes(24).toString("hex"),
          items: { create: orderItemsCreate },
        },
        include: { items: true },
      });

      if (paymentMethodNorm === "on_delivery" && promoIdLocal && orderUserId) {
        await tx.promoUse.create({
          data: { promoId: promoIdLocal, userId: orderUserId, orderId: order.id },
        });
      }

      return { order, promoApplied: !!promoIdLocal, promoCodeRequested: codeRaw };
    });

    const { order, promoApplied, promoCodeRequested } = result;

    if (order.userId) {
      await prisma.userNotification.create({
        data: {
          userId: order.userId,
          title: "Заказ оформлен",
          body: `Заказ ${order.id.slice(0, 10)}… принят. Сумма ${order.total.toLocaleString("ru-RU")} ₽. Статус: ${orderStatusLabel("placed")}.`,
        },
      });
    }

    try {
      const items = await prisma.orderItem.findMany({
        where: { orderId: order.id },
        include: { product: { select: { title: true } } },
      });
      /** void: не await — ответ не должен ждать сеть/Telegram (таймаут 5 c). */
      void sendTelegramMessage(formatOrderNotification(order, items), { parseMode: "HTML" });
    } catch (e) {
      console.warn("Telegram: уведомление о заказе:", e);
    }

    return NextResponse.json({
      order,
      orderNumber: order.id,
      promoApplied,
      promoCodeRequested,
      /** Серверный субтотал (без скидки) — для отладки/UI. */
      subtotal,
    });
  } catch (e) {
    console.error("Order create error:", e);
    return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 });
  }
}

/**
 * Сумма заказа с онлайн-промо (как в транзакции) — для мягкого контроля подтверждения email
 * до брони заказа.
 */
async function previewFinalTotalForOrder(subtotal: number, codeRaw: string | null): Promise<number> {
  if (!codeRaw) return Math.max(0, Math.round(subtotal));
  const promo = await prisma.promo.findFirst({
    where: { code: codeRaw, active: true },
    select: {
      percent: true,
      discountRub: true,
      maxUses: true,
      usedCount: true,
      validFrom: true,
      validTo: true,
      active: true,
      minOrderTotal: true,
    },
  });
  if (!promo) return Math.max(0, Math.round(subtotal));
  const applied = applyPromoToTotal(subtotal, promo);
  if (!applied.ok) return Math.max(0, Math.round(subtotal));
  return Math.max(0, Math.round(applied.finalTotal));
}

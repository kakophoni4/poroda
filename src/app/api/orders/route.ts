import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
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
    include: { items: true },
  });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, name, address, items, promoCode, total } = body as {
      email: string;
      phone: string;
      name: string;
      address: string;
      items: { productId: string; title: string; price: number; quantity: number }[];
      promoCode?: string;
      total: number;
    };
    if (!email || !phone || !name || !address || !items?.length || total == null) {
      return NextResponse.json({ error: "Не заполнены обязательные поля" }, { status: 400 });
    }
    const userSession = await getUserSession();
    let finalTotal = total;
    let promoId: string | null = null;
    if (promoCode) {
      const promo = await prisma.promo.findFirst({
        where: { code: promoCode.toUpperCase().trim(), active: true },
      });
      if (promo && (!promo.maxUses || promo.usedCount < promo.maxUses)) {
        finalTotal = Math.round(total * (1 - promo.percent / 100));
        promoId = promo.id;
      }
    }
    const order = await prisma.order.create({
      data: {
        userId: userSession?.userId ?? null,
        email,
        phone,
        name,
        address,
        status: "pending",
        promoCode: promoCode || null,
        promoId,
        total: finalTotal,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });
    if (promoId && userSession?.userId) {
      await prisma.promoUse.create({
        data: { promoId, userId: userSession.userId, orderId: order.id },
      });
      await prisma.promo.update({
        where: { id: promoId },
        data: { usedCount: { increment: 1 } },
      });
    }
    return NextResponse.json({ order, orderNumber: order.id });
  } catch (e) {
    console.error("Order create error:", e);
    return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 });
  }
}

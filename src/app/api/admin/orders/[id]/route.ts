import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAllowedOrderStatus, orderStatusLabel } from "@/lib/order-status";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, email: true, name: true, phone: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { status, address, phone, name, email } = body as {
    status?: string;
    address?: string;
    phone?: string;
    name?: string;
    email?: string;
  };
  if (status != null && !isAllowedOrderStatus(status)) {
    return NextResponse.json(
      { error: "Недопустимый статус: оформлен, в сборке, в доставке, доставлен" },
      { status: 400 }
    );
  }
  const existing = await prisma.order.findUnique({
    where: { id },
    select: { status: true, userId: true },
  });
  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(status != null && { status }),
      ...(address != null && { address }),
      ...(phone != null && { phone }),
      ...(name != null && { name }),
      ...(email != null && { email }),
    },
    include: { items: true },
  });
  if (
    existing &&
    status != null &&
    status !== existing.status &&
    order.userId
  ) {
    const label = orderStatusLabel(status);
    await prisma.userNotification.create({
      data: {
        userId: order.userId,
        title: `Заказ: ${label}`,
        body: `Статус вашего заказа ${order.id.slice(0, 10)}… изменён на «${label}».`,
      },
    });
  }
  return NextResponse.json(order);
}

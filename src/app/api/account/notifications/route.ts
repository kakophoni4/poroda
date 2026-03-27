import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await prisma.userNotification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, body: true, read: true, createdAt: true },
  });
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, readAll } = body as { id?: string; readAll?: boolean };
  if (readAll) {
    await prisma.userNotification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }
  if (!id?.trim()) {
    return NextResponse.json({ error: "Нужен id уведомления или readAll: true" }, { status: 400 });
  }
  const n = await prisma.userNotification.findFirst({
    where: { id: id.trim(), userId: session.userId },
  });
  if (!n) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  await prisma.userNotification.update({
    where: { id: n.id },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}

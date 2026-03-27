import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Персональное уведомление одному пользователю (видно в ЛК) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: userId } = await params;
  const body = await request.json();
  const { title, body: text } = body as { title?: string; body?: string };
  if (!title?.trim()) {
    return NextResponse.json({ error: "Заголовок обязателен" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  const n = await prisma.userNotification.create({
    data: {
      userId,
      title: title.trim(),
      body: text?.trim() || null,
    },
  });
  return NextResponse.json(n);
}

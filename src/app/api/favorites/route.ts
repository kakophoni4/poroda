import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ productIds: [] });
  const list = await prisma.userFavorite.findMany({
    where: { userId: session.userId },
    select: { productId: true },
  });
  return NextResponse.json({ productIds: list.map((f) => f.productId) });
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
  const body = await request.json();
  const productId = (body as { productId?: string }).productId;
  if (!productId) return NextResponse.json({ error: "productId обязателен" }, { status: 400 });

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  });
  if (existing) {
    await prisma.userFavorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  await prisma.userFavorite.create({
    data: { userId: session.userId, productId },
  });
  return NextResponse.json({ favorited: true });
}

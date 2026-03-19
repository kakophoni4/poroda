import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const list = await prisma.homePromoBanner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { imageUrl, linkUrl, buttonText, buttonColor, sortOrder, active } = body as {
    imageUrl?: string;
    linkUrl?: string;
    buttonText?: string;
    buttonColor?: string;
    sortOrder?: number;
    active?: boolean;
  };
  if (!imageUrl?.trim()) return NextResponse.json({ error: "Нужно изображение" }, { status: 400 });
  try {
    const row = await prisma.homePromoBanner.create({
      data: {
        imageUrl: imageUrl.trim(),
        linkUrl: (linkUrl ?? "").trim(),
        buttonText: (buttonText ?? "").trim(),
        buttonColor: (buttonColor ?? "#18181b").trim() || "#18181b",
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P1008") {
      return NextResponse.json(
        { error: "Таймаут соединения с базой. Используйте локальную БД (localhost) или проверьте доступ к серверу и попробуйте снова." },
        { status: 504 }
      );
    }
    throw e;
  }
}

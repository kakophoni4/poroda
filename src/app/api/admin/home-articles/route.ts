import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getHomeArticlesForAdmin } from "@/lib/home-articles";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const list = await getHomeArticlesForAdmin();
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { title, linkUrl, description, sortOrder, active } = body as {
    title?: string;
    linkUrl?: string;
    description?: string;
    sortOrder?: number;
    active?: boolean;
  };
  if (!title?.trim()) return NextResponse.json({ error: "Нужно название статьи" }, { status: 400 });
  try {
    const row = await prisma.homeArticle.create({
      data: {
        title: title.trim(),
        linkUrl: (linkUrl ?? "").trim(),
        description: (description ?? "").trim(),
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P1008") {
      return NextResponse.json(
        { error: "Таймаут соединения с базой. Попробуйте снова." },
        { status: 504 }
      );
    }
    throw e;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { title, sortOrder, active } = body as { title?: string; sortOrder?: number; active?: boolean };
  if (!title?.trim()) return NextResponse.json({ error: "Нужен заголовок вопроса" }, { status: 400 });
  try {
    const row = await prisma.quizQuestion.create({
      data: {
        title: title.trim(),
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

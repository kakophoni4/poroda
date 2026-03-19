import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { questionId, label, linkUrl, nextQuestionId, sortOrder } = body as {
    questionId?: string;
    label?: string;
    linkUrl?: string;
    nextQuestionId?: string | null;
    sortOrder?: number;
  };
  if (!questionId?.trim()) return NextResponse.json({ error: "Нужен questionId" }, { status: 400 });
  if (!label?.trim()) return NextResponse.json({ error: "Нужен текст ответа" }, { status: 400 });
  try {
    const row = await prisma.quizAnswer.create({
      data: {
        questionId: questionId.trim(),
        label: label.trim(),
        linkUrl: (linkUrl ?? "").trim(),
        nextQuestionId: nextQuestionId && nextQuestionId.trim() ? nextQuestionId.trim() : null,
        sortOrder: sortOrder ?? 0,
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

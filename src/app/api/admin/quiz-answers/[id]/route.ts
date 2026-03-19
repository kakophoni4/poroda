import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const row = await prisma.quizAnswer.update({
    where: { id },
    data: {
      ...(body.label != null && { label: String(body.label).trim() }),
      ...(body.linkUrl != null && { linkUrl: String(body.linkUrl).trim() }),
      ...(body.nextQuestionId !== undefined && {
        nextQuestionId: body.nextQuestionId && String(body.nextQuestionId).trim()
          ? String(body.nextQuestionId).trim()
          : null,
      }),
      ...(body.sortOrder != null && { sortOrder: Number(body.sortOrder) ?? 0 }),
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.quizAnswer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

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
  const row = await prisma.quizQuestion.update({
    where: { id },
    data: {
      ...(body.title != null && { title: String(body.title).trim() }),
      ...(body.sortOrder != null && { sortOrder: Number(body.sortOrder) ?? 0 }),
      ...(body.active != null && { active: !!body.active }),
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
  await prisma.quizQuestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { nullIfEmptyRich, sanitizeText } from "@/lib/sanitize";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const row = await prisma.homeArticle.update({
    where: { id },
    data: {
      ...(body.title != null && { title: sanitizeText(String(body.title), 500).trim() }),
      ...(body.linkUrl != null && { linkUrl: String(body.linkUrl).trim() }),
      ...(body.description != null && { description: nullIfEmptyRich(body.description) ?? "" }),
      ...(body.sortOrder != null && { sortOrder: Number(body.sortOrder) ?? 0 }),
      ...(body.active != null && { active: !!body.active }),
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.homeArticle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

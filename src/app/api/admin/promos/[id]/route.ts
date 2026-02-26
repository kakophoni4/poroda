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
  const promo = await prisma.promo.update({
    where: { id },
    data: {
      ...(body.code != null && { code: body.code.trim().toUpperCase() }),
      ...(body.percent != null && { percent: body.percent }),
      ...(body.description != null && { description: body.description || null }),
      ...(body.maxUses != null && { maxUses: body.maxUses === "" ? null : body.maxUses }),
      ...(body.validFrom != null && { validFrom: body.validFrom ? new Date(body.validFrom) : null }),
      ...(body.validTo != null && { validTo: body.validTo ? new Date(body.validTo) : null }),
      ...(body.active != null && { active: !!body.active }),
    },
  });
  return NextResponse.json(promo);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.promo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

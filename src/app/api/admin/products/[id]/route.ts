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
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(body.slug != null && { slug: body.slug }),
      ...(body.title != null && { title: body.title }),
      ...(body.shortDesc != null && { shortDesc: body.shortDesc }),
      ...(body.categoryId != null && { categoryId: body.categoryId }),
      ...(body.price != null && { price: Math.round(body.price) }),
      ...(body.oldPrice != null && { oldPrice: body.oldPrice === "" ? null : Math.round(body.oldPrice) }),
      ...(body.isNew != null && { isNew: !!body.isNew }),
      ...(body.skinTypes != null && { skinTypes: Array.isArray(body.skinTypes) ? body.skinTypes : [] }),
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

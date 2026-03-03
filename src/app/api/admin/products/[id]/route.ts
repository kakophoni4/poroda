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
      ...(body.categoryId != null && { category: { connect: { id: body.categoryId } } }),
      ...(body.price != null && { price: Math.round(body.price) }),
      ...(body.oldPrice != null && { oldPrice: body.oldPrice === "" ? null : Math.round(body.oldPrice) }),
      ...(body.isNew != null && { isNew: !!body.isNew }),
      ...(body.skinTypes != null && { skinTypes: Array.isArray(body.skinTypes) ? body.skinTypes : [] }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl?.trim() || null }),
      ...(body.imageUrls !== undefined && {
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.map((u: string) => String(u).trim()).filter(Boolean) : [],
      }),
      ...(body.imageFocusX !== undefined && { imageFocusX: body.imageFocusX == null ? null : Math.max(0, Math.min(100, Number(body.imageFocusX))) }),
      ...(body.imageFocusY !== undefined && { imageFocusY: body.imageFocusY == null ? null : Math.max(0, Math.min(100, Number(body.imageFocusY))) }),
      ...(body.composition !== undefined && { composition: body.composition?.trim() || null }),
      ...(body.components !== undefined && { components: body.components?.trim() || null }),
      ...(body.extraField1 !== undefined && { extraField1: body.extraField1?.trim() || null }),
      ...(body.extraField2 !== undefined && { extraField2: body.extraField2?.trim() || null }),
      ...(body.featuredSortOrder !== undefined && {
        featuredSortOrder: body.featuredSortOrder === null || body.featuredSortOrder === "" ? null : Math.max(0, Math.floor(Number(body.featuredSortOrder))),
      }),
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

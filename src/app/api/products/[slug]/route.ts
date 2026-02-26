import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: { select: { slug: true, title: true } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortDesc: product.shortDesc,
    category: product.category.title,
    categorySlug: product.category.slug,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    isNew: product.isNew,
    skinTypes: product.skinTypes,
  });
}

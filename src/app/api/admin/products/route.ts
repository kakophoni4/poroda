import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const products = await prisma.product.findMany({
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: { select: { slug: true, title: true } } },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { slug, title, shortDesc, categoryId, price, oldPrice, isNew, skinTypes } = body as {
    slug: string;
    title: string;
    shortDesc?: string;
    categoryId: string;
    price: number;
    oldPrice?: number;
    isNew?: boolean;
    skinTypes?: string[];
  };
  if (!slug || !title || !categoryId || price == null) {
    return NextResponse.json({ error: "slug, title, categoryId, price обязательны" }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      slug: slug.trim(),
      title: title.trim(),
      shortDesc: shortDesc?.trim() || null,
      categoryId,
      price: Math.round(price),
      oldPrice: oldPrice != null ? Math.round(oldPrice) : null,
      isNew: !!isNew,
      skinTypes: Array.isArray(skinTypes) ? skinTypes : [],
    },
  });
  return NextResponse.json(product);
}

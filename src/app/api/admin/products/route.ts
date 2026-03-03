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
  const {
    slug,
    title,
    shortDesc,
    categoryId,
    price,
    oldPrice,
    isNew,
    skinTypes,
    imageUrl,
    imageUrls,
    imageFocusX,
    imageFocusY,
    composition,
    components,
    extraField1,
    extraField2,
    featuredSortOrder,
  } = body as {
    slug: string;
    title: string;
    shortDesc?: string;
    categoryId: string;
    price: number;
    oldPrice?: number;
    isNew?: boolean;
    skinTypes?: string[];
    imageUrl?: string;
    imageUrls?: string[];
    imageFocusX?: number | null;
    imageFocusY?: number | null;
    composition?: string;
    components?: string;
    extraField1?: string;
    extraField2?: string;
    featuredSortOrder?: number | null;
  };
  if (!slug || !title || !categoryId || price == null) {
    return NextResponse.json({ error: "slug, title, categoryId, price обязательны" }, { status: 400 });
  }
  const urls = Array.isArray(imageUrls) ? imageUrls.map((u) => String(u).trim()).filter(Boolean) : [];
  const focusX = imageFocusX != null ? Math.max(0, Math.min(100, Number(imageFocusX))) : null;
  const focusY = imageFocusY != null ? Math.max(0, Math.min(100, Number(imageFocusY))) : null;
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
      imageUrl: imageUrl?.trim() || urls[0] || null,
      imageUrls: urls,
      imageFocusX: focusX,
      imageFocusY: focusY,
      composition: composition?.trim() || null,
      components: components?.trim() || null,
      extraField1: extraField1?.trim() || null,
      extraField2: extraField2?.trim() || null,
      featuredSortOrder: featuredSortOrder != null && featuredSortOrder !== "" ? Math.max(0, Math.floor(Number(featuredSortOrder))) : null,
    },
  });
  return NextResponse.json(product);
}

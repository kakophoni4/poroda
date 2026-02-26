import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const sort = searchParams.get("sort") || "popular";

  const where = categorySlug ? { category: { slug: categorySlug } } : {};
  const orderBy =
    sort === "price_asc"
      ? [{ price: "asc" as const }]
      : sort === "price_desc"
        ? [{ price: "desc" as const }]
        : sort === "new"
          ? [{ isNew: "desc" as const }, { createdAt: "desc" as const }]
          : [{ sortOrder: "asc" as const }];

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: { category: { select: { slug: true, title: true } } },
  });

  let list = products;
  if (sort === "sale") {
    list = list.filter((p) => p.oldPrice != null);
  }

  return NextResponse.json(
    list.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      shortDesc: p.shortDesc,
      category: p.category.title,
      categorySlug: p.category.slug,
      price: p.price,
      oldPrice: p.oldPrice ?? undefined,
      isNew: p.isNew,
      skinTypes: p.skinTypes,
    }))
  );
}

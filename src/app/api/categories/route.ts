import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { archivedAt: null },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { archivedAt: null } } } } },
  });
  return NextResponse.json(
    categories.map((c) => ({ id: c.id, slug: c.slug, title: c.title, productCount: c._count.products }))
  );
}

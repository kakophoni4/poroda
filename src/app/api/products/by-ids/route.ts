import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_IDS = 50;

export type ProductByIdsRow = {
  id: string;
  inStock: boolean;
  /** ISO-строка, если снят с витрины; иначе null */
  archivedAt: string | null;
};

/**
 * GET /api/products/by-ids?ids=cuid1,cuid2
 * Актуальные признаки наличия/архива для валидации корзины. Без CSRF (GET).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("ids");
  if (raw == null || raw === "") {
    return NextResponse.json({ products: [] as ProductByIdsRow[] });
  }
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `Слишком много id (максимум ${MAX_IDS})` },
      { status: 400 }
    );
  }
  if (ids.length === 0) {
    return NextResponse.json({ products: [] as ProductByIdsRow[] });
  }

  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, inStock: true, archivedAt: true },
    });
    const products: ProductByIdsRow[] = rows.map((p) => ({
      id: p.id,
      inStock: p.inStock,
      archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
    }));
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Не удалось получить товары" }, { status: 503 });
  }
}

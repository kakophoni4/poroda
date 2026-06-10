import AdminProductsClient from "./AdminProductsClient";
import { parseAdminListPaginationFromRoute, totalPages } from "@/lib/admin-list-pagination";
import { getHomeConcernCardsForAdmin } from "@/lib/home-concern-cards";
import { prisma } from "@/lib/db";
import type { Category, Product } from "@prisma/client";

export const dynamic = "force-dynamic";

const MIGRATION_SQL = `-- Выполни в клиенте к PostgreSQL (psql, GUI) или одной сессии SQL:
-- вставь код ниже и выполни.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "composition" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "components" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "extraField1" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "extraField2" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "concernIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkGoldApple" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkLetual" TEXT;
CREATE TABLE IF NOT EXISTS "UserFavorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserFavorite_userId_productId_key" ON "UserFavorite"("userId", "productId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserFavorite_userId_fkey') THEN
    ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserFavorite_productId_fkey') THEN
    ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;`;

type ProductWithCategory = Product & { category: Category };

async function loadAdminProductsCatalog(page: number, limit: number, skip: number): Promise<
  | { needMigration: true }
  | { needMigration: false; total: number; products: ProductWithCategory[]; categories: Category[] }
> {
  try {
    const [total, products, categories] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
        include: { category: true },
      }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    return { needMigration: false, total, products, categories };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "P2022") return { needMigration: true };
    throw e;
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const q = await searchParams;
  const { page, limit, skip } = parseAdminListPaginationFromRoute(q);
  const data = await loadAdminProductsCatalog(page, limit, skip);
  if (data.needMigration) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Продукция</h1>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-medium text-amber-900">В базе данных нет новых колонок</p>
          <p className="mt-2 text-sm text-amber-800">
            Сначала попробуй: <code className="rounded bg-amber-100 px-1">npx prisma migrate deploy</code> (те же миграции, что в репозитории). Если нужен ручной
            SQL — ниже, затем обнови эту страницу.
          </p>
          <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-amber-200 bg-white p-4 text-xs text-zinc-700">
            {MIGRATION_SQL}
          </pre>
        </div>
      </>
    );
  }
  const { total, products, categories } = data;
  const concernCards = (await getHomeConcernCardsForAdmin()).map((c) => ({ id: c.id, title: c.title }));
  const pagination = { page, limit, total, totalPages: totalPages(total, limit) };
  return (
    <>
      <h1 className="text-2xl font-semibold">Продукция</h1>
      <p className="mt-1 text-sm text-zinc-600">Управление каталогом: добавление, редактирование, удаление.</p>
      {total === 0 && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          В базе пока нет позиций каталога. Заполнить каталог: в папке <code className="rounded bg-amber-100 px-1">poroda-site</code> выполни{" "}
          <code className="rounded bg-amber-100 px-1">npx tsx prisma/seed.ts</code> (или <code className="rounded bg-amber-100 px-1">npm run db:seed</code>).
        </p>
      )}
      <AdminProductsClient
        key={`${page}-${total}`}
        initialProducts={products}
        categories={categories}
        concernCards={concernCards}
        pagination={pagination}
      />
    </>
  );
}

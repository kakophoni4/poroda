import AdminProductsClient from "./AdminProductsClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MIGRATION_SQL = `-- Выполни в Supabase: SQL Editor → New query → вставь код ниже → Run.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "composition" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "components" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "extraField1" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "extraField2" TEXT;
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

export default async function AdminProductsPage() {
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }], include: { category: true } }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    return (
      <>
        <h1 className="text-2xl font-semibold">Продукция</h1>
        <p className="mt-1 text-sm text-zinc-600">Управление каталогом: добавление, редактирование, удаление.</p>
        {products.length === 0 && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            В базе пока нет позиций каталога. Заполнить каталог: в папке <code className="rounded bg-amber-100 px-1">poroda-site</code> выполни{" "}
            <code className="rounded bg-amber-100 px-1">npx tsx prisma/seed.ts</code> (или <code className="rounded bg-amber-100 px-1">npm run db:seed</code>).
          </p>
        )}
        <AdminProductsClient initialProducts={products} categories={categories} />
      </>
    );
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "P2022") {
      return (
        <>
          <h1 className="text-2xl font-semibold">Продукция</h1>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="font-medium text-amber-900">В базе данных нет новых колонок</p>
            <p className="mt-2 text-sm text-amber-800">
              Добавь их в Supabase: открой проект → <strong>SQL Editor</strong> → New query → вставь код ниже → <strong>Run</strong>.
              Затем обнови эту страницу.
            </p>
            <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-amber-200 bg-white p-4 text-xs text-zinc-700">
              {MIGRATION_SQL}
            </pre>
            <p className="mt-4 text-sm text-amber-800">
              Либо в терминале из папки проекта: <code className="rounded bg-amber-100 px-1">npx prisma db push</code>
            </p>
          </div>
        </>
      );
    }
    throw e;
  }
}

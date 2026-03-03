-- Выполни в Supabase: SQL Editor → New query → вставь этот код → Run.
-- Добавляет недостающие колонки в Product и таблицу UserFavorite (если их ещё нет).

-- Колонки Product (если ошибка "column does not exist")
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "composition" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "components" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "extraField1" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "extraField2" TEXT;

-- Таблица избранного (если ещё не создана)
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
END $$;

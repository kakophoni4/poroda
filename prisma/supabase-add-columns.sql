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

-- Ссылки на маркетплейсы (карточка товара на сайте)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkWildberries" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkOzon" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkYandexMarket" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dermatologistVideoUrl" TEXT;

-- Тексты сайта (редактирование в админке)
CREATE TABLE IF NOT EXISTS "SiteCopy" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteCopy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SiteCopy_key_key" ON "SiteCopy"("key");

-- Отзывы после заказа + вопросы в админку
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reviewToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_reviewToken_key" ON "Order"("reviewToken");

CREATE TABLE IF NOT EXISTS "CustomerReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rewardCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerReview_orderId_key" ON "CustomerReview"("orderId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomerReview_orderId_fkey') THEN
    ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SiteQuestion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteQuestion_pkey" PRIMARY KEY ("id")
);

-- Колесо на чекауте: скидка в рублях у промокода
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "discountRub" INTEGER;

CREATE TABLE IF NOT EXISTS "WheelGlobalCounter" (
    "id" TEXT NOT NULL,
    "spins" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WheelGlobalCounter_pkey" PRIMARY KEY ("id")
);
INSERT INTO "WheelGlobalCounter" ("id", "spins")
SELECT 'singleton', 0
WHERE NOT EXISTS (SELECT 1 FROM "WheelGlobalCounter" WHERE "id" = 'singleton');

CREATE TABLE IF NOT EXISTS "WheelSpinLog" (
    "id" TEXT NOT NULL,
    "emailNorm" TEXT NOT NULL,
    "phoneNorm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WheelSpinLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WheelSpinLog_emailNorm_phoneNorm_createdAt_idx" ON "WheelSpinLog"("emailNorm", "phoneNorm", "createdAt");

-- Теги проблем на товарах + ссылки Золотое Яблоко / Л'Этуаль
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "concernIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkGoldApple" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "linkLetual" TEXT;

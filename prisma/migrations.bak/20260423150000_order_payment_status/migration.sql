-- Добавляем способ оплаты, статус оплаты и время последней проверки статуса в банке
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'online';
ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE "Order" ADD COLUMN "paymentCheckedAt" TIMESTAMP(3);

-- Старые заказы с оплатой при доставке логически unpaid, но способ можно проставить позже вручную в админке.

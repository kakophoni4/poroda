-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reviewToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_reviewToken_key" ON "Order"("reviewToken");

-- CreateTable
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

ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
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

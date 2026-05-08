-- AlterTable
ALTER TABLE "PageView" ADD COLUMN "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "PageView_ipHash_createdAt_idx" ON "PageView"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_userId_createdAt_idx" ON "PageView"("userId", "createdAt");

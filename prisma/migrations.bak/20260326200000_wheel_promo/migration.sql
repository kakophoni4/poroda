-- AlterTable
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "discountRub" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "WheelGlobalCounter" (
    "id" TEXT NOT NULL,
    "spins" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WheelGlobalCounter_pkey" PRIMARY KEY ("id")
);

INSERT INTO "WheelGlobalCounter" ("id", "spins")
SELECT 'singleton', 0
WHERE NOT EXISTS (SELECT 1 FROM "WheelGlobalCounter" WHERE "id" = 'singleton');

-- CreateTable
CREATE TABLE IF NOT EXISTS "WheelSpinLog" (
    "id" TEXT NOT NULL,
    "emailNorm" TEXT NOT NULL,
    "phoneNorm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WheelSpinLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WheelSpinLog_emailNorm_phoneNorm_createdAt_idx" ON "WheelSpinLog"("emailNorm", "phoneNorm", "createdAt");

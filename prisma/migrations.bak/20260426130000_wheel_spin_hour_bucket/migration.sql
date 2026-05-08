-- AlterTable
ALTER TABLE "WheelSpinLog" ADD COLUMN "hourBucket" TEXT;

-- Backfill: «YYYYMMDD-HH» (как в to_char, без конвертации в другой пояс)
UPDATE "WheelSpinLog"
SET "hourBucket" = to_char("createdAt", 'YYYYMMDD"-"HH24');

-- Дубликаты: оставляем по одной строке на (emailNorm, hourBucket) и (phoneNorm, hourBucket)
DELETE FROM "WheelSpinLog" a
  USING "WheelSpinLog" b
WHERE a."emailNorm" = b."emailNorm"
  AND a."hourBucket" = b."hourBucket"
  AND a."id" > b."id";

DELETE FROM "WheelSpinLog" a
  USING "WheelSpinLog" b
WHERE a."phoneNorm" = b."phoneNorm"
  AND a."hourBucket" = b."hourBucket"
  AND a."id" > b."id";

ALTER TABLE "WheelSpinLog" ALTER COLUMN "hourBucket" SET NOT NULL;

-- Unique: один спин на email в час, один — на телефон в час (защита от гонок)
CREATE UNIQUE INDEX "WheelSpinLog_emailNorm_hourBucket_key" ON "WheelSpinLog"("emailNorm", "hourBucket");
CREATE UNIQUE INDEX "WheelSpinLog_phoneNorm_hourBucket_key" ON "WheelSpinLog"("phoneNorm", "hourBucket");

-- Индекс по ведру часа
CREATE INDEX "WheelSpinLog_hourBucket_idx" ON "WheelSpinLog"("hourBucket");

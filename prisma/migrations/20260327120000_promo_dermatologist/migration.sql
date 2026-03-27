-- AlterTable
ALTER TABLE "Promo" ADD COLUMN "isDermatologist" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Promo" ADD COLUMN "dermatologistRewardPercent" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Mailing" ADD COLUMN "sentInbox" INTEGER;
ALTER TABLE "Mailing" ADD COLUMN "sentEmailOk" INTEGER;
ALTER TABLE "Mailing" ADD COLUMN "sentEmailFail" INTEGER;

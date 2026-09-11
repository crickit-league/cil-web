-- CreateEnum
CREATE TYPE "FeeTier" AS ENUM ('STANDARD', 'SPONSORSHIP');

-- Merge captainFirstName + captainLastName into a single captainName,
-- preserving existing data for any rows already submitted.
ALTER TABLE "registrations" ADD COLUMN "captainName" TEXT;
UPDATE "registrations" SET "captainName" = trim(concat_ws(' ', "captainFirstName", "captainLastName"));
ALTER TABLE "registrations" ALTER COLUMN "captainName" SET NOT NULL;
ALTER TABLE "registrations" DROP COLUMN "captainFirstName";
ALTER TABLE "registrations" DROP COLUMN "captainLastName";

-- AlterTable: vice captain contact fields, fee tier, marketing consent
ALTER TABLE "registrations"
  ADD COLUMN "viceCaptainName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "viceCaptainEmail" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "viceCaptainMobile" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "feeTier" "FeeTier" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "registrations" ALTER COLUMN "viceCaptainName" DROP DEFAULT;
ALTER TABLE "registrations" ALTER COLUMN "viceCaptainEmail" DROP DEFAULT;
ALTER TABLE "registrations" ALTER COLUMN "viceCaptainMobile" DROP DEFAULT;

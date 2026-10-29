-- Fixtures published before their date/time is fixed: startsAt null = date
-- TBD; timeTbd = date known, start time not (startsAt is Atlanta midnight).
-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "timeTbd" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "startsAt" DROP NOT NULL;

-- CreateEnum
CREATE TYPE "AssignmentSource" AS ENUM ('IMPORT', 'ADMIN');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "umpiringTeamId" TEXT,
ADD COLUMN     "umpiringTeamSource" "AssignmentSource";

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_umpiringTeamId_fkey" FOREIGN KEY ("umpiringTeamId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;


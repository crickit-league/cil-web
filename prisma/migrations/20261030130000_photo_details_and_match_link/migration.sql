-- AlterTable
ALTER TABLE "photos" ADD COLUMN "title" TEXT,
ADD COLUMN "body" TEXT,
ADD COLUMN "matchId" TEXT;

-- CreateIndex
CREATE INDEX "photos_matchId_idx" ON "photos"("matchId");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

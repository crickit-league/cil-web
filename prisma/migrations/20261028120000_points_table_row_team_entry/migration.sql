-- AlterTable
ALTER TABLE "points_table_rows" ADD COLUMN     "teamEntryId" TEXT;

-- CreateIndex
CREATE INDEX "points_table_rows_teamEntryId_idx" ON "points_table_rows"("teamEntryId");

-- AddForeignKey
ALTER TABLE "points_table_rows" ADD CONSTRAINT "points_table_rows_teamEntryId_fkey" FOREIGN KEY ("teamEntryId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

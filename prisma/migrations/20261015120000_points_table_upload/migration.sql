-- AlterEnum
ALTER TYPE "ImportKind" ADD VALUE 'CRICCLUBS_POINTS_TABLE';

-- CreateTable
CREATE TABLE "points_tables" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_table_rows" (
    "id" TEXT NOT NULL,
    "pointsTableId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "groupOrder" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "played" INTEGER NOT NULL,
    "won" INTEGER NOT NULL,
    "lost" INTEGER NOT NULL,
    "noResult" INTEGER NOT NULL,
    "tied" INTEGER NOT NULL,
    "points" DECIMAL(6,1) NOT NULL,
    "winPercent" DECIMAL(5,2),
    "netRunRate" DECIMAL(8,4) NOT NULL,
    "runsFor" TEXT,
    "runsAgainst" TEXT,

    CONSTRAINT "points_table_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "points_tables_seriesId_key" ON "points_tables"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "points_table_rows_pointsTableId_groupOrder_position_key" ON "points_table_rows"("pointsTableId", "groupOrder", "position");

-- AddForeignKey
ALTER TABLE "points_tables" ADD CONSTRAINT "points_tables_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_tables" ADD CONSTRAINT "points_tables_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_table_rows" ADD CONSTRAINT "points_table_rows_pointsTableId_fkey" FOREIGN KEY ("pointsTableId") REFERENCES "points_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;


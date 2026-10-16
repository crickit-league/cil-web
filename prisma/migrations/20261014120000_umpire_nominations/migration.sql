-- AlterTable
ALTER TABLE "series" ADD COLUMN     "umpireEntryLocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "umpire_nominations" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "umpireOneName" TEXT,
    "umpireOnePhone" TEXT,
    "umpireTwoName" TEXT,
    "umpireTwoPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "umpire_nominations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "umpire_nominations_matchId_key" ON "umpire_nominations"("matchId");

-- AddForeignKey
ALTER TABLE "umpire_nominations" ADD CONSTRAINT "umpire_nominations_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;


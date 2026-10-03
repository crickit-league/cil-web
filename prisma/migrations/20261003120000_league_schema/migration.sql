-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PlayingRole" AS ENUM ('BATTER', 'BOWLER', 'ALL_ROUNDER');

-- CreateEnum
CREATE TYPE "RosterRole" AS ENUM ('PLAYER', 'CAPTAIN', 'VICE_CAPTAIN');

-- CreateEnum
CREATE TYPE "MatchStage" AS ENUM ('LEAGUE', 'PRE_QUARTER_FINAL', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'ABANDONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResultType" AS ENUM ('RUNS', 'WICKETS', 'TIE', 'SUPER_OVER', 'NO_RESULT', 'FORFEIT');

-- CreateEnum
CREATE TYPE "DismissalType" AS ENUM ('NOT_OUT', 'BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'RETIRED_HURT', 'RETIRED_OUT', 'OTHER');

-- CreateEnum
CREATE TYPE "SponsorTier" AS ENUM ('TITLE', 'GOLD', 'SILVER', 'PARTNER');

-- CreateEnum
CREATE TYPE "ImportKind" AS ENUM ('CRICCLUBS_SERIES', 'CRICCLUBS_MATCHES', 'CRICCLUBS_TEAMS', 'CRICCLUBS_MEMBERS', 'CSV_SCORECARD');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('STAGED', 'COMMITTED', 'FAILED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'UNMATCHED', 'READY', 'COMMITTED', 'SKIPPED');

-- AlterTable
ALTER TABLE "seasons" ALTER COLUMN "registrationOpensAt" DROP NOT NULL,
ALTER COLUMN "registrationClosesAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SeriesStatus" NOT NULL DEFAULT 'UPCOMING',
    "startDate" DATE NOT NULL,
    "ballType" TEXT NOT NULL DEFAULT 'Hard Tennis Ball',
    "playersPerSide" INTEGER NOT NULL DEFAULT 10,
    "maxOvers" INTEGER NOT NULL DEFAULT 15,
    "groupCount" INTEGER NOT NULL DEFAULT 2,
    "winPoints" INTEGER NOT NULL DEFAULT 2,
    "lossPoints" INTEGER NOT NULL DEFAULT 0,
    "tiePoints" INTEGER NOT NULL DEFAULT 1,
    "noResultPoints" INTEGER NOT NULL DEFAULT 1,
    "championEntryId" TEXT,
    "runnerUpEntryId" TEXT,
    "cricclubsSeriesId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_entries" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "shortName" TEXT,
    "logoKey" TEXT,
    "pool" TEXT,
    "homeFieldId" TEXT,
    "registrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "playingRole" "PlayingRole",
    "cricclubsPlayerId" INTEGER,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_entries" (
    "id" TEXT NOT NULL,
    "teamEntryId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "RosterRole" NOT NULL DEFAULT 'PLAYER',
    "jerseyNumber" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roster_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grounds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "mapsUrl" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "notes" TEXT,

    CONSTRAINT "grounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "groundId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "matchNumber" INTEGER,
    "week" INTEGER,
    "stage" "MatchStage" NOT NULL DEFAULT 'LEAGUE',
    "bracketSlot" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "fieldId" TEXT,
    "oversPerSide" INTEGER,
    "teamOneId" TEXT,
    "teamOneSource" TEXT,
    "teamTwoId" TEXT,
    "teamTwoSource" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "resultType" "ResultType",
    "winnerId" TEXT,
    "marginRuns" INTEGER,
    "marginWickets" INTEGER,
    "resultText" TEXT,
    "tossWinnerIsTeamOne" BOOLEAN,
    "tossDecision" TEXT,
    "playerOfMatchId" TEXT,
    "cricclubsMatchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_umpires" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "rawName" TEXT NOT NULL,
    "teamEntryId" TEXT,
    "personId" TEXT,

    CONSTRAINT "match_umpires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "innings" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "isSuperOver" BOOLEAN NOT NULL DEFAULT false,
    "battingEntryId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL,
    "wickets" INTEGER NOT NULL,
    "legalBalls" INTEGER NOT NULL,
    "allOut" BOOLEAN NOT NULL DEFAULT false,
    "byes" INTEGER,
    "legByes" INTEGER,
    "wides" INTEGER,
    "noBalls" INTEGER,
    "penalties" INTEGER,

    CONSTRAINT "innings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_appearances" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamEntryId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isKeeper" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "match_appearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batting_lines" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "personId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL,
    "balls" INTEGER NOT NULL,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "dismissal" "DismissalType" NOT NULL DEFAULT 'NOT_OUT',
    "dismissalText" TEXT,
    "bowlerId" TEXT,
    "fielderId" TEXT,
    "secondFielderId" TEXT,

    CONSTRAINT "batting_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bowling_lines" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "legalBalls" INTEGER NOT NULL,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "dots" INTEGER,
    "runs" INTEGER NOT NULL,
    "wickets" INTEGER NOT NULL,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bowling_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings_adjustments" (
    "id" TEXT NOT NULL,
    "teamEntryId" TEXT NOT NULL,
    "matchId" TEXT,
    "pointsDelta" INTEGER NOT NULL DEFAULT 0,
    "runsDelta" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "appliedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standings_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoKey" TEXT,
    "websiteUrl" TEXT,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_sponsors" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "tier" "SponsorTier" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "series_sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" TEXT NOT NULL,
    "kind" "ImportKind" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'STAGED',
    "fileName" TEXT NOT NULL,
    "seriesId" TEXT,
    "error" TEXT,
    "startedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt" TIMESTAMP(3),

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "raw" JSONB NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "name_aliases" (
    "id" TEXT NOT NULL,
    "rawName" TEXT NOT NULL,
    "teamId" TEXT,
    "personId" TEXT,
    "fieldId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "name_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "series_championEntryId_key" ON "series"("championEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "series_runnerUpEntryId_key" ON "series"("runnerUpEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "series_cricclubsSeriesId_key" ON "series"("cricclubsSeriesId");

-- CreateIndex
CREATE UNIQUE INDEX "series_seasonId_name_key" ON "series"("seasonId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_entries_registrationId_key" ON "team_entries"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "team_entries_seriesId_teamId_key" ON "team_entries"("seriesId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_entries_seriesId_displayName_key" ON "team_entries"("seriesId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "people_cricclubsPlayerId_key" ON "people"("cricclubsPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "people_userId_key" ON "people"("userId");

-- CreateIndex
CREATE INDEX "people_email_idx" ON "people"("email");

-- CreateIndex
CREATE INDEX "roster_entries_teamEntryId_idx" ON "roster_entries"("teamEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "roster_entries_seriesId_personId_key" ON "roster_entries"("seriesId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "grounds_name_key" ON "grounds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fields_groundId_label_key" ON "fields"("groundId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "matches_cricclubsMatchId_key" ON "matches"("cricclubsMatchId");

-- CreateIndex
CREATE INDEX "matches_seriesId_stage_idx" ON "matches"("seriesId", "stage");

-- CreateIndex
CREATE INDEX "matches_startsAt_idx" ON "matches"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "matches_seriesId_startsAt_teamOneId_teamTwoId_key" ON "matches"("seriesId", "startsAt", "teamOneId", "teamTwoId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_seriesId_matchNumber_key" ON "matches"("seriesId", "matchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "matches_seriesId_bracketSlot_key" ON "matches"("seriesId", "bracketSlot");

-- CreateIndex
CREATE UNIQUE INDEX "match_umpires_matchId_slot_key" ON "match_umpires"("matchId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "innings_matchId_number_key" ON "innings"("matchId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "match_appearances_matchId_personId_key" ON "match_appearances"("matchId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "batting_lines_inningsId_personId_key" ON "batting_lines"("inningsId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "bowling_lines_inningsId_personId_key" ON "bowling_lines"("inningsId", "personId");

-- CreateIndex
CREATE INDEX "standings_adjustments_teamEntryId_idx" ON "standings_adjustments"("teamEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "sponsors_name_key" ON "sponsors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "series_sponsors_seriesId_sponsorId_key" ON "series_sponsors"("seriesId", "sponsorId");

-- CreateIndex
CREATE INDEX "import_runs_kind_createdAt_idx" ON "import_runs"("kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "import_rows_runId_rowNumber_key" ON "import_rows"("runId", "rowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "name_aliases_rawName_key" ON "name_aliases"("rawName");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_name_key" ON "seasons"("name");

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_championEntryId_fkey" FOREIGN KEY ("championEntryId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_runnerUpEntryId_fkey" FOREIGN KEY ("runnerUpEntryId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_entries" ADD CONSTRAINT "team_entries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_entries" ADD CONSTRAINT "team_entries_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_entries" ADD CONSTRAINT "team_entries_homeFieldId_fkey" FOREIGN KEY ("homeFieldId") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_entries" ADD CONSTRAINT "team_entries_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_entries" ADD CONSTRAINT "roster_entries_teamEntryId_fkey" FOREIGN KEY ("teamEntryId") REFERENCES "team_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_entries" ADD CONSTRAINT "roster_entries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_entries" ADD CONSTRAINT "roster_entries_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_groundId_fkey" FOREIGN KEY ("groundId") REFERENCES "grounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamOneId_fkey" FOREIGN KEY ("teamOneId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamTwoId_fkey" FOREIGN KEY ("teamTwoId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_playerOfMatchId_fkey" FOREIGN KEY ("playerOfMatchId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_umpires" ADD CONSTRAINT "match_umpires_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_umpires" ADD CONSTRAINT "match_umpires_teamEntryId_fkey" FOREIGN KEY ("teamEntryId") REFERENCES "team_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_umpires" ADD CONSTRAINT "match_umpires_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innings" ADD CONSTRAINT "innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innings" ADD CONSTRAINT "innings_battingEntryId_fkey" FOREIGN KEY ("battingEntryId") REFERENCES "team_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_appearances" ADD CONSTRAINT "match_appearances_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_appearances" ADD CONSTRAINT "match_appearances_teamEntryId_fkey" FOREIGN KEY ("teamEntryId") REFERENCES "team_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_appearances" ADD CONSTRAINT "match_appearances_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_lines" ADD CONSTRAINT "batting_lines_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_lines" ADD CONSTRAINT "batting_lines_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_lines" ADD CONSTRAINT "batting_lines_bowlerId_fkey" FOREIGN KEY ("bowlerId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_lines" ADD CONSTRAINT "batting_lines_fielderId_fkey" FOREIGN KEY ("fielderId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_lines" ADD CONSTRAINT "batting_lines_secondFielderId_fkey" FOREIGN KEY ("secondFielderId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bowling_lines" ADD CONSTRAINT "bowling_lines_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bowling_lines" ADD CONSTRAINT "bowling_lines_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings_adjustments" ADD CONSTRAINT "standings_adjustments_teamEntryId_fkey" FOREIGN KEY ("teamEntryId") REFERENCES "team_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings_adjustments" ADD CONSTRAINT "standings_adjustments_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings_adjustments" ADD CONSTRAINT "standings_adjustments_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_sponsors" ADD CONSTRAINT "series_sponsors_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_sponsors" ADD CONSTRAINT "series_sponsors_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_runId_fkey" FOREIGN KEY ("runId") REFERENCES "import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_aliases" ADD CONSTRAINT "name_aliases_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_aliases" ADD CONSTRAINT "name_aliases_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_aliases" ADD CONSTRAINT "name_aliases_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;


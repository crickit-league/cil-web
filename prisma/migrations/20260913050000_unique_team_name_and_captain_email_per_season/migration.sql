-- CreateIndex
CREATE UNIQUE INDEX "registrations_seasonId_teamName_key" ON "registrations"("seasonId", "teamName");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_seasonId_captainEmail_key" ON "registrations"("seasonId", "captainEmail");

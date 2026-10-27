-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "caption" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photos_storageKey_key" ON "photos"("storageKey");

-- CreateIndex
CREATE INDEX "photos_createdAt_idx" ON "photos"("createdAt");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

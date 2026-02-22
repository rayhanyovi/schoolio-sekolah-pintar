-- CreateEnum
CREATE TYPE "UploadIntentStatus" AS ENUM ('PENDING', 'UPLOADED', 'CONFIRMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UploadScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'FAILED');

-- AlterTable
ALTER TABLE "MaterialAttachment"
ADD COLUMN "checksumSha256" TEXT,
ADD COLUMN "etag" TEXT,
ADD COLUMN "scanStatus" "UploadScanStatus",
ADD COLUMN "uploadIntentId" TEXT;

-- CreateTable
CREATE TABLE "UploadIntent" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadTokenHash" TEXT NOT NULL,
    "uploadedSizeBytes" INTEGER,
    "uploadedChecksumSha256" TEXT,
    "status" "UploadIntentStatus" NOT NULL DEFAULT 'PENDING',
    "scanStatus" "UploadScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanResult" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UploadIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadScanJob" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "status" "UploadScanStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "result" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UploadScanJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAttachment_uploadIntentId_key" ON "MaterialAttachment"("uploadIntentId");

-- CreateIndex
CREATE INDEX "UploadIntent_materialId_status_idx" ON "UploadIntent"("materialId", "status");

-- CreateIndex
CREATE INDEX "UploadIntent_expiresAt_status_idx" ON "UploadIntent"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UploadScanJob_intentId_key" ON "UploadScanJob"("intentId");

-- CreateIndex
CREATE INDEX "UploadScanJob_status_queuedAt_idx" ON "UploadScanJob"("status", "queuedAt");

-- AddForeignKey
ALTER TABLE "MaterialAttachment" ADD CONSTRAINT "MaterialAttachment_uploadIntentId_fkey" FOREIGN KEY ("uploadIntentId") REFERENCES "UploadIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadIntent" ADD CONSTRAINT "UploadIntent_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadIntent" ADD CONSTRAINT "UploadIntent_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadIntent" ADD CONSTRAINT "UploadIntent_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadScanJob" ADD CONSTRAINT "UploadScanJob_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "UploadIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

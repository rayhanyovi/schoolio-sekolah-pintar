-- CreateTable
CREATE TABLE "ParentInvite" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "redeemedAt" TIMESTAMP(3),
    "redeemedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentInvite_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "schoolId" TEXT;

-- AlterTable
ALTER TABLE "AcademicYear"
ADD COLUMN "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Class"
ADD COLUMN "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subject"
ADD COLUMN "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleTemplate"
ADD COLUMN "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Major"
ADD COLUMN "schoolId" TEXT NOT NULL;

-- Backfill missing school code before making it required
UPDATE "SchoolProfile"
SET "schoolCode" = CONCAT(
  'SCH-',
  UPPER(SUBSTRING(REGEXP_REPLACE("id", '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
)
WHERE "schoolCode" IS NULL;

-- AlterTable
ALTER TABLE "SchoolProfile"
ALTER COLUMN "schoolCode" SET NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "Major_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "ParentInvite_codeHash_key" ON "ParentInvite"("codeHash");

-- CreateIndex
CREATE INDEX "ParentInvite_schoolId_isActive_idx" ON "ParentInvite"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "ParentInvite_studentId_isActive_idx" ON "ParentInvite"("studentId", "isActive");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_idx" ON "AcademicYear"("schoolId");

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject"("schoolId", "code");

-- CreateIndex
CREATE INDEX "ScheduleTemplate_schoolId_idx" ON "ScheduleTemplate"("schoolId");

-- CreateIndex
CREATE INDEX "Major_schoolId_idx" ON "Major"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Major_schoolId_code_key" ON "Major"("schoolId", "code");

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class"
ADD CONSTRAINT "Class_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear"
ADD CONSTRAINT "AcademicYear_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject"
ADD CONSTRAINT "Subject_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTemplate"
ADD CONSTRAINT "ScheduleTemplate_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Major"
ADD CONSTRAINT "Major_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentInvite"
ADD CONSTRAINT "ParentInvite_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentInvite"
ADD CONSTRAINT "ParentInvite_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentInvite"
ADD CONSTRAINT "ParentInvite_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentInvite"
ADD CONSTRAINT "ParentInvite_redeemedByUserId_fkey"
FOREIGN KEY ("redeemedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Assignment"
ADD COLUMN "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lateUntil" TIMESTAMP(3);

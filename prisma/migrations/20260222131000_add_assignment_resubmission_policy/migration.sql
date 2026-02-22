-- AlterTable
ALTER TABLE "Assignment"
ADD COLUMN "maxAttempts" INTEGER;

-- AlterTable
ALTER TABLE "AssignmentSubmission"
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0;

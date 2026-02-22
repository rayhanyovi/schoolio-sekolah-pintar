-- CreateEnum
CREATE TYPE "GradingPolicy" AS ENUM ('LATEST', 'HIGHEST', 'MANUAL');

-- AlterTable
ALTER TABLE "Assignment"
ADD COLUMN "gradingPolicy" "GradingPolicy" NOT NULL DEFAULT 'LATEST';

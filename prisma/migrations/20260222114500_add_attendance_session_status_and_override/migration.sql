-- CreateEnum
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('OPEN', 'LOCKED', 'FINALIZED');

-- AlterTable
ALTER TABLE "AttendanceSession"
ADD COLUMN "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "overriddenById" TEXT,
ADD COLUMN "overrideReason" TEXT,
ADD COLUMN "overriddenAt" TIMESTAMP(3),
ADD COLUMN "lockedAt" TIMESTAMP(3),
ADD COLUMN "finalizedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AttendanceSession_status_idx" ON "AttendanceSession"("status");

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

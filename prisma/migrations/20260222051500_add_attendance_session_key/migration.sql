-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN "sessionKey" TEXT;

-- Backfill existing data
UPDATE "AttendanceSession"
SET "sessionKey" = 'legacy:' || "id"
WHERE "sessionKey" IS NULL;

-- Enforce not-null + unique constraint
ALTER TABLE "AttendanceSession" ALTER COLUMN "sessionKey" SET NOT NULL;
CREATE UNIQUE INDEX "AttendanceSession_sessionKey_key" ON "AttendanceSession"("sessionKey");

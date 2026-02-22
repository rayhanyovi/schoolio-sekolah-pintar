-- CreateEnum
CREATE TYPE "StudentLifecycleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED_OUT');

-- AlterTable
ALTER TABLE "StudentProfile"
ADD COLUMN "status" "StudentLifecycleStatus" NOT NULL DEFAULT 'ACTIVE';

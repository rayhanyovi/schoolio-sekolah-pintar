-- AlterTable
ALTER TABLE "SchoolProfile"
ADD COLUMN "schoolCode" TEXT;

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AuthCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_userId_key" ON "AuthCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_identifier_key" ON "AuthCredential"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfile_schoolCode_key" ON "SchoolProfile"("schoolCode");

-- AddForeignKey
ALTER TABLE "AuthCredential"
ADD CONSTRAINT "AuthCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Backfill existing users to avoid forced onboarding
UPDATE "User"
SET "onboardingCompletedAt" = NOW()
WHERE "onboardingCompletedAt" IS NULL;

-- Backfill deterministic school code for existing school profile rows
UPDATE "SchoolProfile"
SET "schoolCode" = CONCAT(
  'SCH-',
  UPPER(SUBSTRING(REGEXP_REPLACE("id", '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
)
WHERE "schoolCode" IS NULL;

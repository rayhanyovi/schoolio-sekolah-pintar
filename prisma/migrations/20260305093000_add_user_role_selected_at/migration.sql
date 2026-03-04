ALTER TABLE "User"
ADD COLUMN "roleSelectedAt" TIMESTAMP(3);

UPDATE "User"
SET "roleSelectedAt" = COALESCE("roleSelectedAt", "onboardingCompletedAt", NOW())
WHERE "roleSelectedAt" IS NULL;

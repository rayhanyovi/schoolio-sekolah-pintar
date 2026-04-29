-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "firstSource" TEXT NOT NULL,
    "lastSource" TEXT NOT NULL,
    "userId" TEXT,
    "schoolId" TEXT,
    "role" "Role",
    "demoInstanceId" TEXT,
    "submittedCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_emailNormalized_key" ON "WaitlistEntry"("emailNormalized");

-- CreateIndex
CREATE INDEX "WaitlistEntry_createdAt_idx" ON "WaitlistEntry"("createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_lastSource_updatedAt_idx" ON "WaitlistEntry"("lastSource", "updatedAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_idx" ON "WaitlistEntry"("userId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_schoolId_idx" ON "WaitlistEntry"("schoolId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_demoInstanceId_idx" ON "WaitlistEntry"("demoInstanceId");

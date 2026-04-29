CREATE TABLE "DemoInstance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "templateSchoolId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoInstance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DemoInstance_schoolId_key" ON "DemoInstance"("schoolId");
CREATE INDEX "DemoInstance_expiresAt_idx" ON "DemoInstance"("expiresAt");
CREATE INDEX "DemoInstance_lastAccessedAt_idx" ON "DemoInstance"("lastAccessedAt");
CREATE INDEX "DemoInstance_templateSchoolId_idx" ON "DemoInstance"("templateSchoolId");

ALTER TABLE "DemoInstance"
ADD CONSTRAINT "DemoInstance_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "DemoInstance"
ADD CONSTRAINT "DemoInstance_templateSchoolId_fkey"
FOREIGN KEY ("templateSchoolId") REFERENCES "SchoolProfile"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "DemoInstance"
ADD CONSTRAINT "DemoInstance_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "DemoInstance"
ADD CONSTRAINT "DemoInstance_teacherUserId_fkey"
FOREIGN KEY ("teacherUserId") REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "DemoInstance"
ADD CONSTRAINT "DemoInstance_studentUserId_fkey"
FOREIGN KEY ("studentUserId") REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "DemoInstance"
ADD CONSTRAINT "DemoInstance_parentUserId_fkey"
FOREIGN KEY ("parentUserId") REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;


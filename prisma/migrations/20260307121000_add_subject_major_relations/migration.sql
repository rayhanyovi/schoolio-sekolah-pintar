-- AlterTable
ALTER TABLE "Subject"
ADD COLUMN "appliesToAllMajors" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SubjectMajor" (
    "subjectId" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,

    CONSTRAINT "SubjectMajor_pkey" PRIMARY KEY ("subjectId","majorId")
);

-- CreateIndex
CREATE INDEX "SubjectMajor_majorId_idx" ON "SubjectMajor"("majorId");

-- AddForeignKey
ALTER TABLE "SubjectMajor"
ADD CONSTRAINT "SubjectMajor_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectMajor"
ADD CONSTRAINT "SubjectMajor_majorId_fkey"
FOREIGN KEY ("majorId") REFERENCES "Major"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ReportCardSnapshot" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "ReportCardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportCardSnapshot_classId_academicYearId_semester_publishedAt_idx" ON "ReportCardSnapshot"("classId", "academicYearId", "semester", "publishedAt");

-- AddForeignKey
ALTER TABLE "ReportCardSnapshot" ADD CONSTRAINT "ReportCardSnapshot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSnapshot" ADD CONSTRAINT "ReportCardSnapshot_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSnapshot" ADD CONSTRAINT "ReportCardSnapshot_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

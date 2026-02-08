-- CreateTable
CREATE TABLE "MajorTeacher" (
    "majorId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "MajorTeacher_pkey" PRIMARY KEY ("majorId","teacherId")
);

-- CreateIndex
CREATE INDEX "MajorTeacher_teacherId_idx" ON "MajorTeacher"("teacherId");

-- AddForeignKey
ALTER TABLE "MajorTeacher" ADD CONSTRAINT "MajorTeacher_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorTeacher" ADD CONSTRAINT "MajorTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

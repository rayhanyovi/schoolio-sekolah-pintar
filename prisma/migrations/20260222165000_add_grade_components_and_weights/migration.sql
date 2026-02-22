-- CreateEnum
CREATE TYPE "GradeComponent" AS ENUM ('HOMEWORK', 'QUIZ', 'EXAM', 'PRACTICAL');

-- AlterTable
ALTER TABLE "Assignment"
ADD COLUMN "gradeComponent" "GradeComponent" NOT NULL DEFAULT 'HOMEWORK';

-- CreateTable
CREATE TABLE "GradeWeight" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "homeworkWeight" INTEGER NOT NULL DEFAULT 25,
    "quizWeight" INTEGER NOT NULL DEFAULT 25,
    "examWeight" INTEGER NOT NULL DEFAULT 25,
    "practicalWeight" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeWeight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GradeWeight_subjectId_classId_semester_key" ON "GradeWeight"("subjectId", "classId", "semester");

-- CreateIndex
CREATE INDEX "GradeWeight_classId_semester_idx" ON "GradeWeight"("classId", "semester");

-- AddForeignKey
ALTER TABLE "GradeWeight" ADD CONSTRAINT "GradeWeight_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeWeight" ADD CONSTRAINT "GradeWeight_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

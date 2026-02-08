-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "takenByTeacherId" TEXT;

-- CreateTable
CREATE TABLE "TeacherAttendance" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "sessionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_takenByTeacherId_fkey" FOREIGN KEY ("takenByTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

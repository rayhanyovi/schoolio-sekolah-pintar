import { AttendanceSessionStatus } from "@prisma/client";

const DEFAULT_TEACHER_EDIT_CUTOFF_HOURS = 24;

export const getTeacherAttendanceCutoffHours = () => {
  const parsed = Number.parseInt(
    process.env.ATTENDANCE_TEACHER_EDIT_CUTOFF_HOURS ?? "",
    10
  );
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TEACHER_EDIT_CUTOFF_HOURS;
  }
  return parsed;
};

export const isTeacherAttendanceCutoffPassed = (
  sessionDate: Date,
  now = new Date()
) => {
  const cutoffMs = getTeacherAttendanceCutoffHours() * 60 * 60 * 1000;
  return now.getTime() > sessionDate.getTime() + cutoffMs;
};

export const canTeacherWriteAttendance = (
  status: AttendanceSessionStatus,
  sessionDate: Date,
  now = new Date()
) => status === "OPEN" && !isTeacherAttendanceCutoffPassed(sessionDate, now);

export const needsAdminAttendanceOverride = (
  status: AttendanceSessionStatus,
  sessionDate: Date,
  now = new Date()
) => status !== "OPEN" || isTeacherAttendanceCutoffPassed(sessionDate, now);

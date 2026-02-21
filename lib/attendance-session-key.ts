type AttendanceSessionKeyInput = {
  classId: string;
  subjectId: string;
  date: Date;
  scheduleId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

export const buildAttendanceSessionKey = (input: AttendanceSessionKeyInput) => {
  const dateKey = toDateKey(input.date);
  if (input.scheduleId) {
    return `schedule:${input.scheduleId}:${dateKey}`;
  }

  const startKey = input.startTime?.trim() || "-";
  const endKey = input.endTime?.trim() || "-";
  return [
    "manual",
    input.classId,
    input.subjectId,
    dateKey,
    startKey,
    endKey,
  ].join(":");
};

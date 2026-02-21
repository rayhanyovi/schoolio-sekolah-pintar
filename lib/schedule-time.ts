const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isValidClockTime = (value: string) => CLOCK_TIME_PATTERN.test(value);

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
};

export const validateScheduleTimeRange = (startTime: string, endTime: string) => {
  if (!isValidClockTime(startTime) || !isValidClockTime(endTime)) {
    return "startTime and endTime must use HH:mm format";
  }
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    return "startTime must be earlier than endTime";
  }
  return null;
};

export type ScheduleOverlapLookupInput = {
  classId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export const isOverlappingTimeRange = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) => toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);

export const findClassOverlapSchedule = async (
  schedules: Array<{
    id: string;
    classId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>,
  input: ScheduleOverlapLookupInput,
  excludeId?: string
) => {
  return (
    schedules.find((schedule) => {
      if (excludeId && schedule.id === excludeId) return false;
      if (schedule.classId !== input.classId) return false;
      if (schedule.dayOfWeek !== input.dayOfWeek) return false;
      return isOverlappingTimeRange(
        schedule.startTime,
        schedule.endTime,
        input.startTime,
        input.endTime
      );
    }) ?? null
  );
};

export const findTeacherOverlapSchedule = (
  schedules: Array<{
    id: string;
    teacherId: string | null;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>,
  input: {
    teacherId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  },
  excludeId?: string
) => {
  return (
    schedules.find((schedule) => {
      if (excludeId && schedule.id === excludeId) return false;
      if (schedule.teacherId !== input.teacherId) return false;
      if (schedule.dayOfWeek !== input.dayOfWeek) return false;
      return isOverlappingTimeRange(
        schedule.startTime,
        schedule.endTime,
        input.startTime,
        input.endTime
      );
    }) ?? null
  );
};

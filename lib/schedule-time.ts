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

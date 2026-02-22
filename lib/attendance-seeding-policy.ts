import { EventType } from "@prisma/client";

type AttendanceSeedEvent = {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
};

export type AttendanceSeedPolicyCode =
  | "NORMAL_DAY"
  | "SCHOOL_HOLIDAY"
  | "EXAM_PERIOD";

export const resolveAttendanceSeedPolicy = (events: AttendanceSeedEvent[]) => {
  for (const event of events) {
    if (event.type === "HOLIDAY") {
      return {
        shouldSeed: false,
        code: "SCHOOL_HOLIDAY" as const,
        blockedByEventId: event.id,
      };
    }
  }

  for (const event of events) {
    const normalized = `${event.title} ${event.description ?? ""}`.toUpperCase();
    if (
      normalized.includes("EXAM_PERIOD") ||
      normalized.includes("UJIAN") ||
      normalized.includes("ASSESSMENT_WEEK")
    ) {
      return {
        shouldSeed: false,
        code: "EXAM_PERIOD" as const,
        blockedByEventId: event.id,
      };
    }
  }

  return {
    shouldSeed: true,
    code: "NORMAL_DAY" as const,
    blockedByEventId: null,
  };
};

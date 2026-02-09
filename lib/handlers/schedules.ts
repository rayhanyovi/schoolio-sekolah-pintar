import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { scheduleListSchema, scheduleSchema } from "@/lib/schemas";

export type SchedulePayload = Record<string, unknown>;
type UnknownRecord = Record<string, unknown>;

export type ListSchedulesParams = {
  classId?: string;
  teacherId?: string;
  dayOfWeek?: string;
};

export const listSchedules = async (params?: ListSchedulesParams) =>
  scheduleListSchema.parse(await apiGet("/api/schedules", params));

const normalizeSchedule = (value: UnknownRecord) => {
  const classValue =
    value.class && typeof value.class === "object"
      ? (value.class as UnknownRecord)
      : null;
  const subjectValue =
    value.subject && typeof value.subject === "object"
      ? (value.subject as UnknownRecord)
      : null;
  const teacherValue =
    value.teacher && typeof value.teacher === "object"
      ? (value.teacher as UnknownRecord)
      : null;

  if (value && typeof value === "object") {
    return {
      id: value.id,
      classId: value.classId,
      className:
        (typeof classValue?.name === "string" ? classValue.name : undefined) ??
        value.className ??
        "",
      subjectId: value.subjectId,
      subjectName:
        (typeof subjectValue?.name === "string"
          ? subjectValue.name
          : undefined) ??
        value.subjectName ??
        "",
      subjectCode:
        (typeof subjectValue?.code === "string"
          ? subjectValue.code
          : undefined) ??
        value.subjectCode ??
        "",
      teacherId: value.teacherId ?? undefined,
      teacherName:
        (typeof teacherValue?.name === "string"
          ? teacherValue.name
          : undefined) ??
        value.teacherName ??
        "",
      dayOfWeek: value.dayOfWeek,
      startTime: value.startTime,
      endTime: value.endTime,
      room: value.room ?? "",
      color:
        value.color ??
        (typeof subjectValue?.color === "string" ? subjectValue.color : "") ??
        "",
    };
  }
  return value;
};

export const getSchedule = async (id: string) => {
  const data = await apiGet<Record<string, unknown>>(`/api/schedules/${id}`);
  return scheduleSchema.parse(normalizeSchedule(data as UnknownRecord));
};

export const createSchedule = async (payload: SchedulePayload) => {
  const created = await apiPost<SchedulePayload>("/api/schedules", payload);
  if (created && typeof created === "object" && "id" in created) {
    return getSchedule(String(created.id));
  }
  return scheduleSchema.parse(created);
};

export const updateSchedule = async (id: string, payload: SchedulePayload) => {
  const updated = await apiPatch<SchedulePayload>(
    `/api/schedules/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return getSchedule(String(updated.id));
  }
  return scheduleSchema.parse(updated);
};

export const deleteSchedule = (id: string) =>
  apiDelete<{ id: string }>(`/api/schedules/${id}`);

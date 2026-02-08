import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { scheduleListSchema, scheduleSchema } from "@/lib/schemas";

export type SchedulePayload = Record<string, unknown>;

export type ListSchedulesParams = {
  classId?: string;
  teacherId?: string;
  dayOfWeek?: string;
};

export const listSchedules = async (params?: ListSchedulesParams) =>
  scheduleListSchema.parse(await apiGet("/api/schedules", params));

const normalizeSchedule = (value: Record<string, any>) => {
  if (value && typeof value === "object") {
    return {
      id: value.id,
      classId: value.classId,
      className: value.class?.name ?? value.className ?? "",
      subjectId: value.subjectId,
      subjectName: value.subject?.name ?? value.subjectName ?? "",
      subjectCode: value.subject?.code ?? value.subjectCode ?? "",
      teacherId: value.teacherId ?? undefined,
      teacherName: value.teacher?.name ?? value.teacherName ?? "",
      dayOfWeek: value.dayOfWeek,
      startTime: value.startTime,
      endTime: value.endTime,
      room: value.room ?? "",
      color: value.color ?? value.subject?.color ?? "",
    };
  }
  return value;
};

export const getSchedule = async (id: string) => {
  const data = await apiGet<Record<string, unknown>>(`/api/schedules/${id}`);
  return scheduleSchema.parse(normalizeSchedule(data as Record<string, any>));
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

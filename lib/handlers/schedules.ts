import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type SchedulePayload = Record<string, unknown>;

export type ListSchedulesParams = {
  classId?: string;
  teacherId?: string;
  dayOfWeek?: string;
};

export const listSchedules = (params?: ListSchedulesParams) =>
  apiGet<SchedulePayload[]>("/api/schedules", params);

export const getSchedule = (id: string) =>
  apiGet<SchedulePayload>(`/api/schedules/${id}`);

export const createSchedule = (payload: SchedulePayload) =>
  apiPost<SchedulePayload>("/api/schedules", payload);

export const updateSchedule = (id: string, payload: SchedulePayload) =>
  apiPatch<SchedulePayload>(`/api/schedules/${id}`, payload);

export const deleteSchedule = (id: string) =>
  apiDelete<{ id: string }>(`/api/schedules/${id}`);

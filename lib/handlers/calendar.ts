import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";

export type CalendarPayload = Record<string, unknown>;

export type ListEventsParams = {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  classId?: string;
};

export const listEvents = (params?: ListEventsParams) =>
  apiGet<CalendarPayload[]>("/api/calendar/events", params);

export const getEvent = (id: string) =>
  apiGet<CalendarPayload>(`/api/calendar/events/${id}`);

export const createEvent = (payload: CalendarPayload) =>
  apiPost<CalendarPayload>("/api/calendar/events", payload);

export const updateEvent = (id: string, payload: CalendarPayload) =>
  apiPatch<CalendarPayload>(`/api/calendar/events/${id}`, payload);

export const deleteEvent = (id: string) =>
  apiDelete<{ id: string }>(`/api/calendar/events/${id}`);

export const setEventClasses = (id: string, classIds: string[]) =>
  apiPut<CalendarPayload>(`/api/calendar/events/${id}/classes`, { classIds });

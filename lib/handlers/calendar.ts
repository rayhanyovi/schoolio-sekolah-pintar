import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import { calendarEventListSchema, calendarEventSchema } from "@/lib/schemas";

export type CalendarPayload = Record<string, unknown>;

export type ListEventsParams = {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  classId?: string;
};

export const listEvents = async (params?: ListEventsParams) =>
  calendarEventListSchema.parse(await apiGet("/api/calendar/events", params));

export const getEvent = async (id: string) =>
  calendarEventSchema.parse(await apiGet(`/api/calendar/events/${id}`));

export const createEvent = async (payload: CalendarPayload) => {
  const created = await apiPost<CalendarPayload>(
    "/api/calendar/events",
    payload
  );
  if (created && typeof created === "object" && "id" in created) {
    return getEvent(String(created.id));
  }
  return calendarEventSchema.parse(created);
};

export const updateEvent = async (id: string, payload: CalendarPayload) => {
  const updated = await apiPatch<CalendarPayload>(
    `/api/calendar/events/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return getEvent(String(updated.id));
  }
  return calendarEventSchema.parse(updated);
};

export const deleteEvent = (id: string) =>
  apiDelete<{ id: string }>(`/api/calendar/events/${id}`);

export const setEventClasses = (id: string, classIds: string[]) =>
  apiPut<CalendarPayload>(`/api/calendar/events/${id}/classes`, { classIds });

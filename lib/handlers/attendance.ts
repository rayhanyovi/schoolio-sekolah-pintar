import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import {
  attendanceRecordListSchema,
  attendanceSessionListSchema,
  attendanceSessionSchema,
} from "@/lib/schemas";

export type ListAttendanceSessionsParams = {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  date?: string;
};

export type ListAttendanceRecordsParams = {
  studentId?: string;
  subjectId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const listAttendanceSessions = (params?: ListAttendanceSessionsParams) =>
  apiGet("/api/attendance/sessions", params).then((data) =>
    attendanceSessionListSchema.parse(data)
  );

export const getAttendanceSession = (id: string) =>
  apiGet(`/api/attendance/sessions/${id}`).then((data) =>
    attendanceSessionSchema.parse(data)
  );

export const createAttendanceSession = (payload: Record<string, unknown>) =>
  apiPost("/api/attendance/sessions", payload).then((data) =>
    attendanceSessionSchema.parse(data)
  );

export const updateAttendanceSession = (
  id: string,
  payload: Record<string, unknown>
) =>
  apiPatch(`/api/attendance/sessions/${id}`, payload).then((data) =>
    attendanceSessionSchema.parse(data)
  );

export const deleteAttendanceSession = (id: string) =>
  apiDelete<{ id: string }>(`/api/attendance/sessions/${id}`);

export const listAttendanceRecords = (params?: ListAttendanceRecordsParams) =>
  apiGet("/api/attendance/records", params).then((data) =>
    attendanceRecordListSchema.parse(data)
  );

export const upsertAttendanceRecords = (
  sessionId: string,
  records: Record<string, unknown>[]
) =>
  apiPost(`/api/attendance/sessions/${sessionId}/records`, {
    records,
  });

export const updateAttendanceRecord = (id: string, payload: Record<string, unknown>) =>
  apiPatch(`/api/attendance/records/${id}`, payload);

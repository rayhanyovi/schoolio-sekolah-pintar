import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import {
  attendanceRecordListSchema,
  attendanceSessionListSchema,
  attendanceSessionSchema,
  teacherAttendanceListSchema,
  teacherAttendanceSchema,
} from "@/lib/schemas";

const normalizeAttendanceSession = (value: Record<string, any>) => {
  if (value && typeof value === "object") {
    return {
      id: value.id,
      classId: value.classId,
      className: value.class?.name ?? value.className ?? "",
      subjectId: value.subjectId,
      subjectName: value.subject?.name ?? value.subjectName ?? "",
      teacherId: value.teacherId ?? value.teacher?.id ?? null,
      teacherName: value.teacher?.name ?? value.teacherName ?? "",
      takenByTeacherId:
        value.takenByTeacherId ?? value.takenBy?.id ?? value.takenByTeacherId ?? null,
      takenByTeacherName: value.takenBy?.name ?? value.takenByTeacherName ?? "",
      scheduleId: value.scheduleId ?? null,
      date: value.date,
      startTime: value.startTime ?? "",
      endTime: value.endTime ?? "",
    };
  }
  return value;
};

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

export type ListTeacherAttendanceParams = {
  teacherId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const listAttendanceSessions = (params?: ListAttendanceSessionsParams) =>
  apiGet("/api/attendance/sessions", params).then((data) =>
    attendanceSessionListSchema.parse(
      Array.isArray(data)
        ? data.map((item) => normalizeAttendanceSession(item))
        : data
    )
  );

export const getAttendanceSession = (id: string) =>
  apiGet(`/api/attendance/sessions/${id}`).then((data) =>
    attendanceSessionSchema.parse(normalizeAttendanceSession(data))
  );

export const createAttendanceSession = (payload: Record<string, unknown>) =>
  apiPost("/api/attendance/sessions", payload).then((data) =>
    attendanceSessionSchema.parse(normalizeAttendanceSession(data))
  );

export const updateAttendanceSession = (
  id: string,
  payload: Record<string, unknown>
) =>
  apiPatch(`/api/attendance/sessions/${id}`, payload).then((data) =>
    attendanceSessionSchema.parse(normalizeAttendanceSession(data))
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

export const listTeacherAttendance = (params?: ListTeacherAttendanceParams) =>
  apiGet("/api/teacher-attendance", params).then((data) =>
    teacherAttendanceListSchema.parse(
      Array.isArray(data)
        ? data.map((item) => normalizeTeacherAttendance(item))
        : data
    )
  );

export const createTeacherAttendance = (payload: Record<string, unknown>) =>
  apiPost("/api/teacher-attendance", payload).then((data) =>
    teacherAttendanceSchema.parse(normalizeTeacherAttendance(data))
  );

const normalizeTeacherAttendance = (value: Record<string, any>) => {
  if (value && typeof value === "object") {
    return {
      id: value.id,
      teacherId: value.teacherId,
      teacherName: value.teacher?.name ?? value.teacherName ?? "",
      sessionId: value.sessionId ?? null,
      date: value.date,
      status: value.status,
      note: value.note ?? "",
      isAllDay: Boolean(value.isAllDay),
    };
  }
  return value;
};

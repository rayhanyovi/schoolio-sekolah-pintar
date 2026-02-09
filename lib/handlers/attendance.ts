import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import {
  attendanceRecordListSchema,
  attendanceSessionListSchema,
  attendanceSessionSchema,
  teacherAttendanceListSchema,
  teacherAttendanceSchema,
} from "@/lib/schemas";

type UnknownRecord = Record<string, unknown>;

const normalizeAttendanceSession = (value: UnknownRecord) => {
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
  const takenByValue =
    value.takenBy && typeof value.takenBy === "object"
      ? (value.takenBy as UnknownRecord)
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
      teacherId:
        value.teacherId ??
        (typeof teacherValue?.id === "string" ? teacherValue.id : null),
      teacherName:
        (typeof teacherValue?.name === "string"
          ? teacherValue.name
          : undefined) ??
        value.teacherName ??
        "",
      takenByTeacherId:
        value.takenByTeacherId ??
        (typeof takenByValue?.id === "string" ? takenByValue.id : null),
      takenByTeacherName:
        (typeof takenByValue?.name === "string"
          ? takenByValue.name
          : undefined) ??
        value.takenByTeacherName ??
        "",
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
    attendanceSessionSchema.parse(
      normalizeAttendanceSession(data as UnknownRecord)
    )
  );

export const createAttendanceSession = (payload: Record<string, unknown>) =>
  apiPost("/api/attendance/sessions", payload).then((data) =>
    attendanceSessionSchema.parse(
      normalizeAttendanceSession(data as UnknownRecord)
    )
  );

export const updateAttendanceSession = (
  id: string,
  payload: Record<string, unknown>
) =>
  apiPatch(`/api/attendance/sessions/${id}`, payload).then((data) =>
    attendanceSessionSchema.parse(
      normalizeAttendanceSession(data as UnknownRecord)
    )
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

const normalizeTeacherAttendance = (value: UnknownRecord) => {
  const teacherValue =
    value.teacher && typeof value.teacher === "object"
      ? (value.teacher as UnknownRecord)
      : null;

  if (value && typeof value === "object") {
    return {
      id: value.id,
      teacherId: value.teacherId,
      teacherName:
        (typeof teacherValue?.name === "string"
          ? teacherValue.name
          : undefined) ??
        value.teacherName ??
        "",
      sessionId: value.sessionId ?? null,
      date: value.date,
      status: value.status,
      note: value.note ?? "",
      isAllDay: Boolean(value.isAllDay),
    };
  }
  return value;
};

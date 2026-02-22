import { NextRequest } from "next/server";
import { DayOfWeek, Prisma } from "@prisma/client";
import { jsonError, jsonOk, parseJsonRecordBody, requireAuth, requireRole } from "@/lib/api";
import { resolveAcademicYearScope } from "@/lib/academic-year-scope";
import { resolveAttendanceSeedPolicy } from "@/lib/attendance-seeding-policy";
import { buildAttendanceSessionKey } from "@/lib/attendance-session-key";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const DAY_MAP: Record<number, DayOfWeek | null> = {
  0: null,
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

const parseDateOnly = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDayOfWeek = (value: Date): DayOfWeek | null => DAY_MAP[value.getUTCDay()] ?? null;

const toDayStart = (value: Date) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const addDays = (value: Date, offset: number) => {
  const copy = new Date(value);
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
};

const eachDate = (from: Date, to: Date) => {
  const days: Date[] = [];
  let cursor = toDayStart(from);
  const end = toDayStart(to);
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
};

const eventAppliesOnDate = (
  eventDate: Date,
  eventEndDate: Date | null,
  date: Date
) => {
  const current = toDayStart(date).getTime();
  const start = toDayStart(eventDate).getTime();
  const end = toDayStart(eventEndDate ?? eventDate).getTime();
  return current >= start && current <= end;
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const from = parseDateOnly(body?.dateFrom);
  const to = parseDateOnly(body?.dateTo);
  if (!from || !to) {
    return jsonError("VALIDATION_ERROR", "dateFrom dan dateTo wajib format YYYY-MM-DD", 400);
  }
  if (to.getTime() < from.getTime()) {
    return jsonError("VALIDATION_ERROR", "dateTo harus >= dateFrom", 400);
  }
  const rangeLengthDays =
    Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (rangeLengthDays > 31) {
    return jsonError(
      "VALIDATION_ERROR",
      "Rentang seeding maksimal 31 hari per request",
      400
    );
  }

  const requestedClassId =
    typeof body?.classId === "string" && body.classId.trim()
      ? body.classId.trim()
      : null;
  const requestedAcademicYearId =
    typeof body?.academicYearId === "string" && body.academicYearId.trim()
      ? body.academicYearId.trim()
      : null;

  const yearScopeResult = await resolveAcademicYearScope(request);
  if (yearScopeResult.error) return yearScopeResult.error;

  let targetAcademicYearId = yearScopeResult.scope.academicYearId;
  if (requestedAcademicYearId) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: requestedAcademicYearId },
      select: { id: true },
    });
    if (!academicYear) {
      return jsonError("NOT_FOUND", "academicYearId tidak ditemukan", 404);
    }
    targetAcademicYearId = academicYear.id;
  }

  if (!targetAcademicYearId) {
    return jsonError(
      "VALIDATION_ERROR",
      "Tidak ada active academic year. Kirim academicYearId eksplisit.",
      400
    );
  }

  const schedules = await prisma.classSchedule.findMany({
    where: {
      ...(requestedClassId ? { classId: requestedClassId } : {}),
      class: { academicYearId: targetAcademicYearId },
    },
    select: {
      id: true,
      classId: true,
      subjectId: true,
      teacherId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
    },
    orderBy: [{ classId: "asc" }, { startTime: "asc" }],
  });

  if (!schedules.length) {
    return jsonOk({
      academicYearId: targetAcademicYearId,
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
      candidateSlots: 0,
      createdSessions: 0,
      skippedExisting: 0,
      skippedByPolicy: 0,
      policyBreakdown: {
        NORMAL_DAY: 0,
        SCHOOL_HOLIDAY: 0,
        EXAM_PERIOD: 0,
      },
    });
  }

  const classIds = Array.from(new Set(schedules.map((row) => row.classId)));
  const eventsWhere: Prisma.CalendarEventWhereInput = {
    AND: [
      { date: { lte: to } },
      {
        OR: [{ endDate: { gte: from } }, { date: { gte: from } }],
      },
      {
        OR: [
          { classes: { some: { classId: { in: classIds } } } },
          { classes: { none: {} } },
        ],
      },
    ],
  };

  const events = await prisma.calendarEvent.findMany({
    where: eventsWhere,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      date: true,
      endDate: true,
      classes: {
        select: { classId: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const existingSessions = await prisma.attendanceSession.findMany({
    where: {
      scheduleId: { in: schedules.map((row) => row.id) },
      date: { gte: from, lte: addDays(to, 1) },
    },
    select: { sessionKey: true },
  });
  const existingKeys = new Set(existingSessions.map((row) => row.sessionKey));

  const days = eachDate(from, to);
  let candidateSlots = 0;
  let createdSessions = 0;
  let skippedExisting = 0;
  let skippedByPolicy = 0;
  const policyBreakdown = {
    NORMAL_DAY: 0,
    SCHOOL_HOLIDAY: 0,
    EXAM_PERIOD: 0,
  };

  for (const day of days) {
    const dayOfWeek = toDayOfWeek(day);
    if (!dayOfWeek) continue;

    const daySchedules = schedules.filter((row) => row.dayOfWeek === dayOfWeek);
    for (const schedule of daySchedules) {
      candidateSlots += 1;

      const relevantEvents = events.filter((event) => {
        if (!eventAppliesOnDate(event.date, event.endDate, day)) return false;
        if (!event.classes.length) return true;
        return event.classes.some((item) => item.classId === schedule.classId);
      });
      const policy = resolveAttendanceSeedPolicy(relevantEvents);
      policyBreakdown[policy.code] += 1;

      if (!policy.shouldSeed) {
        skippedByPolicy += 1;
        continue;
      }

      const sessionDate = toDayStart(day);
      const sessionKey = buildAttendanceSessionKey({
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        date: sessionDate,
        scheduleId: schedule.id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
      if (existingKeys.has(sessionKey)) {
        skippedExisting += 1;
        continue;
      }

      await prisma.attendanceSession.create({
        data: {
          sessionKey,
          classId: schedule.classId,
          subjectId: schedule.subjectId,
          teacherId: schedule.teacherId,
          takenByTeacherId: schedule.teacherId,
          scheduleId: schedule.id,
          date: sessionDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
      existingKeys.add(sessionKey);
      createdSessions += 1;
    }
  }

  return jsonOk({
    academicYearId: targetAcademicYearId,
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
    candidateSlots,
    createdSessions,
    skippedExisting,
    skippedByPolicy,
    policyBreakdown,
  });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  canTeacherManageSubjectClass,
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { buildAttendanceSessionKey } from "@/lib/attendance-session-key";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (teacherId) where.teacherId = teacherId;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  if (auth.role === ROLES.TEACHER) {
    const teacherFilter: Prisma.AttendanceSessionWhereInput = {
      OR: [{ teacherId: auth.userId }, { takenByTeacherId: auth.userId }],
    };
    Object.assign(where, {
      AND: [teacherFilter],
    });
  }

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId) {
      return jsonOk([]);
    }
    if (classId && classId !== ownClassId) {
      return jsonError("FORBIDDEN", "Class access out of scope", 403);
    }
    where.classId = ownClassId;
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.length) {
      return jsonOk([]);
    }
    if (classId && !linkedClassIds.includes(classId)) {
      return jsonError("FORBIDDEN", "Class access out of scope", 403);
    }
    where.classId = classId ? classId : { in: linkedClassIds };
  }

  const rows = await prisma.attendanceSession.findMany({
    where: where as Prisma.AttendanceSessionWhereInput,
    include: { class: true, subject: true, teacher: true, takenBy: true },
    orderBy: { date: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    classId: row.classId,
    className: row.class.name,
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    teacherId: row.teacherId ?? undefined,
    teacherName: row.teacher?.name ?? "",
    takenByTeacherId: row.takenByTeacherId ?? undefined,
    takenByTeacherName: row.takenBy?.name ?? "",
    scheduleId: row.scheduleId ?? undefined,
    date: row.date,
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.classId || !body?.subjectId || !body?.date) {
    return jsonError("VALIDATION_ERROR", "classId, subjectId, date are required");
  }
  const sessionDate = new Date(body.date);
  if (Number.isNaN(sessionDate.getTime())) {
    return jsonError("VALIDATION_ERROR", "date is invalid");
  }

  if (auth.role === ROLES.TEACHER) {
    const allowed = await canTeacherManageSubjectClass(
      auth.userId,
      body.subjectId,
      body.classId
    );
    if (!allowed) {
      return jsonError(
        "FORBIDDEN",
        "Guru tidak memiliki akses ke kombinasi mapel/kelas ini",
        403
      );
    }
  }

  const teacherId = auth.role === ROLES.ADMIN ? body.teacherId ?? null : auth.userId;
  const takenByTeacherId =
    auth.role === ROLES.ADMIN
      ? body.takenByTeacherId ?? null
      : auth.userId;
  const sessionKey = buildAttendanceSessionKey({
    classId: body.classId,
    subjectId: body.subjectId,
    date: sessionDate,
    scheduleId: body.scheduleId ?? null,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
  });

  const row = await prisma.attendanceSession.upsert({
    where: { sessionKey },
    create: {
      sessionKey,
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId,
      takenByTeacherId,
      scheduleId: body.scheduleId ?? null,
      date: sessionDate,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
    },
    update: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId,
      takenByTeacherId,
      scheduleId: body.scheduleId ?? null,
      date: sessionDate,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
    },
  });

  return jsonOk(row);
}

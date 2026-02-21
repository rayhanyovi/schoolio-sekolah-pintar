import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  canTeacherManageSubjectClass,
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import {
  findClassOverlapSchedule,
  findTeacherOverlapSchedule,
  validateScheduleTimeRange,
} from "@/lib/schedule-time";
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
  const teacherId = searchParams.get("teacherId");
  const dayOfWeek = searchParams.get("dayOfWeek");

  const where: Record<string, unknown> = {};
  if (classId) where.classId = classId;
  if (teacherId) where.teacherId = teacherId;
  if (dayOfWeek) where.dayOfWeek = dayOfWeek;

  if (auth.role === ROLES.TEACHER) {
    where.teacherId = auth.userId;
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

  const rows = await prisma.classSchedule.findMany({
    where: where as Prisma.ClassScheduleWhereInput,
    include: { class: true, subject: true, teacher: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const data = rows.map((row) => ({
    id: row.id,
    classId: row.classId,
    className: row.class?.name ?? "",
    subjectId: row.subjectId,
    subjectName: row.subject?.name ?? "",
    subjectCode: row.subject?.code ?? "",
    teacherId: row.teacherId ?? undefined,
    teacherName: row.teacher?.name ?? "",
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    room: row.room ?? "",
    color: row.color ?? row.subject?.color ?? "",
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.classId || !body?.subjectId || !body?.dayOfWeek || !body?.startTime || !body?.endTime) {
    return jsonError(
      "VALIDATION_ERROR",
      "classId, subjectId, dayOfWeek, startTime, endTime are required"
    );
  }

  const timeRangeError = validateScheduleTimeRange(body.startTime, body.endTime);
  if (timeRangeError) {
    return jsonError("VALIDATION_ERROR", timeRangeError);
  }
  const resolvedTeacherId =
    auth.role === ROLES.ADMIN ? body.teacherId ?? null : auth.userId;

  const classSchedules = await prisma.classSchedule.findMany({
    where: {
      classId: body.classId,
      dayOfWeek: body.dayOfWeek,
    },
    select: {
      id: true,
      classId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
    },
  });
  const classConflict = findClassOverlapSchedule(classSchedules, {
    classId: body.classId,
    dayOfWeek: body.dayOfWeek,
    startTime: body.startTime,
    endTime: body.endTime,
  });
  if (classConflict) {
    return jsonError(
      "CONFLICT",
      "Jadwal bentrok dengan jadwal kelas lain pada rentang waktu yang sama",
      409
    );
  }

  if (resolvedTeacherId) {
    const teacherSchedules = await prisma.classSchedule.findMany({
      where: {
        teacherId: resolvedTeacherId,
        dayOfWeek: body.dayOfWeek,
      },
      select: {
        id: true,
        teacherId: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    });
    const teacherConflict = findTeacherOverlapSchedule(teacherSchedules, {
      teacherId: resolvedTeacherId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
    });
    if (teacherConflict) {
      return jsonError(
        "CONFLICT",
        "Jadwal bentrok dengan jadwal guru pada rentang waktu yang sama",
        409
      );
    }
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

  const subject = await prisma.subject.findUnique({
    where: { id: body.subjectId },
    select: { color: true },
  });

  const row = await prisma.classSchedule.create({
    data: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: resolvedTeacherId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room ?? null,
      color: subject?.color ?? "bg-primary",
    },
  });

  return jsonOk(row, { status: 201 });
}

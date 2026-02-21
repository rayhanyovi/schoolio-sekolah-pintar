import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { canTeacherManageSubjectClass } from "@/lib/authz";
import { buildAttendanceSessionKey } from "@/lib/attendance-session-key";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const canTeacherManageSession = async (
  teacherId: string,
  session: {
    teacherId: string | null;
    takenByTeacherId: string | null;
    subjectId: string;
    classId: string;
  }
) => {
  if (session.teacherId === teacherId || session.takenByTeacherId === teacherId) {
    return true;
  }
  return canTeacherManageSubjectClass(teacherId, session.subjectId, session.classId);
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  const row = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      class: true,
      subject: true,
      teacher: true,
      takenBy: true,
      records: true,
    },
  });
  if (!row) return jsonError("NOT_FOUND", "Attendance session not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const allowed = await canTeacherManageSession(auth.userId, row);
    if (!allowed) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke sesi ini", 403);
    }
  }
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  const body = await request.json();
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const existing = await prisma.attendanceSession.findUnique({
    where: { id },
    select: {
      id: true,
      sessionKey: true,
      classId: true,
      subjectId: true,
      teacherId: true,
      takenByTeacherId: true,
      scheduleId: true,
      date: true,
      startTime: true,
      endTime: true,
    },
  });
  if (!existing) return jsonError("NOT_FOUND", "Attendance session not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const canManageCurrent = await canTeacherManageSession(auth.userId, existing);
    if (!canManageCurrent) {
      return jsonError("FORBIDDEN", "Anda tidak bisa mengubah sesi ini", 403);
    }
    const nextSubjectId =
      typeof body.subjectId === "string" ? body.subjectId : existing.subjectId;
    const nextClassId =
      typeof body.classId === "string" ? body.classId : existing.classId;
    const allowed = await canTeacherManageSubjectClass(
      auth.userId,
      nextSubjectId,
      nextClassId
    );
    if (!allowed) {
      return jsonError(
        "FORBIDDEN",
        "Guru tidak memiliki akses ke kombinasi mapel/kelas ini",
        403
      );
    }
  }

  const nextDate =
    body.date !== undefined ? new Date(body.date) : existing.date;
  if (Number.isNaN(nextDate.getTime())) {
    return jsonError("VALIDATION_ERROR", "date is invalid");
  }
  const nextClassId =
    typeof body.classId === "string" ? body.classId : existing.classId;
  const nextSubjectId =
    typeof body.subjectId === "string" ? body.subjectId : existing.subjectId;
  const nextScheduleId =
    body.scheduleId !== undefined ? body.scheduleId : existing.scheduleId;
  const nextStartTime =
    body.startTime !== undefined ? body.startTime : existing.startTime;
  const nextEndTime = body.endTime !== undefined ? body.endTime : existing.endTime;
  const nextSessionKey = buildAttendanceSessionKey({
    classId: nextClassId,
    subjectId: nextSubjectId,
    date: nextDate,
    scheduleId: nextScheduleId ?? null,
    startTime: nextStartTime ?? null,
    endTime: nextEndTime ?? null,
  });

  try {
    const row = await prisma.attendanceSession.update({
      where: { id },
      data: {
        sessionKey: nextSessionKey,
        classId: body.classId,
        subjectId: body.subjectId,
        teacherId:
          auth.role === ROLES.ADMIN
            ? body.teacherId
            : body.teacherId !== undefined
              ? auth.userId
              : undefined,
        takenByTeacherId:
          auth.role === ROLES.ADMIN
            ? body.takenByTeacherId
            : body.takenByTeacherId !== undefined
              ? auth.userId
              : undefined,
        scheduleId: body.scheduleId,
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime,
        endTime: body.endTime,
      },
    });
    return jsonOk(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(
        "CONFLICT",
        "Attendance session dengan business key yang sama sudah ada",
        409
      );
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const existing = await prisma.attendanceSession.findUnique({
    where: { id },
    select: {
      classId: true,
      subjectId: true,
      teacherId: true,
      takenByTeacherId: true,
    },
  });
  if (!existing) return jsonError("NOT_FOUND", "Attendance session not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const allowed = await canTeacherManageSession(auth.userId, existing);
    if (!allowed) {
      return jsonError("FORBIDDEN", "Anda tidak bisa menghapus sesi ini", 403);
    }
  }

  await prisma.attendanceSession.delete({ where: { id } });
  return jsonOk({ id });
}

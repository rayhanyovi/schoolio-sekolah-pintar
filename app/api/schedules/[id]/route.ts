import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  canTeacherManageSubjectClass,
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

const canTeacherManageSchedule = async (
  teacherId: string,
  schedule: {
    teacherId: string | null;
    subjectId: string;
    classId: string;
  }
) => {
  if (schedule.teacherId === teacherId) return true;
  return canTeacherManageSubjectClass(teacherId, schedule.subjectId, schedule.classId);
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const row = await prisma.classSchedule.findUnique({
    where: { id },
    include: { class: true, subject: true, teacher: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Schedule not found", 404);

  if (auth.role === ROLES.TEACHER) {
    const allowed = await canTeacherManageSchedule(auth.userId, row);
    if (!allowed) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke jadwal ini", 403);
    }
  }

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId || row.classId !== ownClassId) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke jadwal ini", 403);
    }
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.includes(row.classId)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke jadwal ini", 403);
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
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const existing = await prisma.classSchedule.findUnique({
    where: { id },
    select: {
      id: true,
      classId: true,
      subjectId: true,
      teacherId: true,
    },
  });
  if (!existing) return jsonError("NOT_FOUND", "Schedule not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const canManage = await canTeacherManageSchedule(auth.userId, existing);
    if (!canManage) {
      return jsonError("FORBIDDEN", "Anda tidak bisa mengubah jadwal ini", 403);
    }
  }

  const body = await request.json();
  if (auth.role === ROLES.TEACHER) {
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

  const row = await prisma.classSchedule.update({
    where: { id },
    data: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId:
        auth.role === ROLES.ADMIN
          ? body.teacherId
          : body.teacherId !== undefined
            ? auth.userId
            : undefined,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room,
      color: body.color,
    },
  });
  return jsonOk(row);
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
  const existing = await prisma.classSchedule.findUnique({
    where: { id },
    select: {
      classId: true,
      subjectId: true,
      teacherId: true,
    },
  });
  if (!existing) return jsonError("NOT_FOUND", "Schedule not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const allowed = await canTeacherManageSchedule(auth.userId, existing);
    if (!allowed) {
      return jsonError("FORBIDDEN", "Anda tidak bisa menghapus jadwal ini", 403);
    }
  }

  await prisma.classSchedule.delete({ where: { id } });
  return jsonOk({ id });
}

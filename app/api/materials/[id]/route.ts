import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  canTeacherManageSubjectClass,
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

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

  const row = await prisma.material.findUnique({
    where: { id: params.id },
    include: { subject: true, class: true, teacher: true, attachments: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Material not found", 404);

  if (auth.role === ROLES.TEACHER && row.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke materi ini", 403);
  }

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId || (row.classId !== null && row.classId !== ownClassId)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke materi ini", 403);
    }
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (row.classId !== null && !linkedClassIds.includes(row.classId)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke materi ini", 403);
    }
  }

  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const existing = await prisma.material.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      teacherId: true,
      subjectId: true,
      classId: true,
    },
  });
  if (!existing) return jsonError("NOT_FOUND", "Material not found", 404);
  if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah materi ini", 403);
  }

  const body = await request.json();
  if (auth.role === ROLES.TEACHER) {
    const nextSubjectId =
      typeof body.subjectId === "string" ? body.subjectId : existing.subjectId;
    const nextClassId =
      body.classId !== undefined ? body.classId : existing.classId;
    const allowed = await canTeacherManageSubjectClass(
      auth.userId,
      nextSubjectId,
      nextClassId ?? null
    );
    if (!allowed) {
      return jsonError(
        "FORBIDDEN",
        "Guru tidak memiliki akses ke kombinasi mapel/kelas ini",
        403
      );
    }
  }

  const teacherId =
    auth.role === ROLES.ADMIN
      ? body.teacherId !== undefined
        ? body.teacherId
        : existing.teacherId
      : auth.userId;
  if (!teacherId) {
    return jsonError("VALIDATION_ERROR", "teacherId is required", 400);
  }

  const row = await prisma.material.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      subjectId: body.subjectId,
      classId: body.classId,
      teacherId,
    },
  });
  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const existing = await prisma.material.findUnique({
    where: { id: params.id },
    select: { teacherId: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Material not found", 404);
  if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa menghapus materi ini", 403);
  }

  await prisma.material.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

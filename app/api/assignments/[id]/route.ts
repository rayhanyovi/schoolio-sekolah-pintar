import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockAssignments } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

const teacherCanManageSubject = async (teacherId: string, subjectId: string) => {
  const relation = await prisma.subjectTeacher.findUnique({
    where: {
      subjectId_teacherId: {
        subjectId,
        teacherId,
      },
    },
    select: { teacherId: true },
  });
  return Boolean(relation);
};

const subjectMatchesClasses = async (subjectId: string, classIds: string[]) => {
  if (!classIds.length) return true;
  const rows = await prisma.subjectClass.findMany({
    where: {
      subjectId,
      classId: { in: classIds },
    },
    select: { classId: true },
  });
  return rows.length === classIds.length;
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

  if (isMockEnabled()) {
    const item = mockAssignments.find((row) => row.id === id);
    if (!item) return jsonError("NOT_FOUND", "Assignment not found", 404);
    return jsonOk({
      ...item,
      kind: item.type,
      deliveryType: null,
      type: item.type,
    });
  }

  const row = await prisma.assignment.findUnique({
    where: { id },
    include: { subject: true, teacher: true, classes: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Assignment not found", 404);

  if (auth.role === ROLES.TEACHER && row.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
  }
  if (auth.role === ROLES.STUDENT) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: auth.userId },
      select: { classId: true },
    });
    const ownClassId = profile?.classId ?? null;
    const classIds = row.classes.map((link) => link.classId);
    if (!ownClassId || !classIds.includes(ownClassId)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
    }
  }
  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
    }
    const profiles = await prisma.studentProfile.findMany({
      where: { userId: { in: linkedStudentIds } },
      select: { classId: true },
    });
    const parentClassIds = new Set(
      profiles
        .map((profile) => profile.classId)
        .filter((value): value is string => Boolean(value))
    );
    const isAllowed = row.classes.some((link) => parentClassIds.has(link.classId));
    if (!isAllowed) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
    }
  }

  const data = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    teacherId: row.teacherId,
    teacherName: row.teacher.name,
    classIds: row.classes.map((link) => link.classId),
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    kind: row.kind,
    deliveryType: row.deliveryType,
    type: row.deliveryType ?? row.kind,
    status: row.status,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  const existing = await prisma.assignment.findUnique({
    where: { id },
    include: { classes: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Assignment not found", 404);
  if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah tugas ini", 403);
  }

  const body = await request.json();
  const nextSubjectId =
    typeof body.subjectId === "string" ? body.subjectId : existing.subjectId;
  const nextClassIds = Array.isArray(body.classIds)
    ? body.classIds
    : existing.classes.map((row) => row.classId);

  if (auth.role === ROLES.TEACHER) {
    const hasSubjectAccess = await teacherCanManageSubject(
      auth.userId,
      nextSubjectId
    );
    if (!hasSubjectAccess) {
      return jsonError(
        "FORBIDDEN",
        "Guru tidak terdaftar sebagai pengampu mapel ini",
        403
      );
    }
    const hasClassAccess = await subjectMatchesClasses(
      nextSubjectId,
      nextClassIds
    );
    if (!hasClassAccess) {
      return jsonError(
        "FORBIDDEN",
        "Kelas yang dipilih tidak sesuai relasi mapel",
        403
      );
    }
  }

  const row = await prisma.assignment.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      subjectId: body.subjectId,
      teacherId:
        auth.role === ROLES.ADMIN ? body.teacherId : existing.teacherId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      kind: body.kind ?? undefined,
      deliveryType: body.deliveryType ?? body.type ?? undefined,
      status: body.status,
    },
  });

  if (Array.isArray(body.classIds)) {
    await prisma.assignmentClass.deleteMany({ where: { assignmentId: row.id } });
    if (body.classIds.length) {
      await prisma.assignmentClass.createMany({
        data: body.classIds.map((cid: string) => ({
          assignmentId: row.id,
          classId: cid,
        })),
        skipDuplicates: true,
      });
    }
  }

  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  const existing = await prisma.assignment.findUnique({
    where: { id },
    select: { teacherId: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Assignment not found", 404);
  if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa menghapus tugas ini", 403);
  }

  await prisma.assignment.delete({ where: { id } });
  return jsonOk({ id });
}

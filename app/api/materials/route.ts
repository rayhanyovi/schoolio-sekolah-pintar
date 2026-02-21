import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  canTeacherManageSubjectClass,
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
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
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: Record<string, unknown> = {};
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (teacherId) where.teacherId = teacherId;
  if (q) where.title = { contains: q, mode: "insensitive" };

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
    if (classId) {
      where.classId = ownClassId;
    } else {
      where.OR = [{ classId: ownClassId }, { classId: null }];
    }
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.length) {
      return jsonOk([]);
    }
    if (classId && !linkedClassIds.includes(classId)) {
      return jsonError("FORBIDDEN", "Class access out of scope", 403);
    }
    if (classId) {
      where.classId = classId;
    } else {
      where.OR = [{ classId: { in: linkedClassIds } }, { classId: null }];
    }
  }

  const rows = await prisma.material.findMany({
    where: where as Prisma.MaterialWhereInput,
    include: { subject: true, class: true, teacher: true, attachments: true },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    subject: row.subject.name,
    subjectId: row.subjectId,
    className: row.class?.name ?? "",
    classId: row.classId ?? undefined,
    teacher: row.teacher.name,
    teacherId: row.teacherId,
    createdAt: row.createdAt,
    attachments: row.attachments.map((file) => ({
      id: file.id,
      name: file.fileName,
      size: file.sizeLabel ?? "",
      type: file.fileType,
      url: file.url ?? undefined,
      storageKey: file.storageKey ?? undefined,
    })),
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.title || !body?.subjectId) {
    return jsonError("VALIDATION_ERROR", "title and subjectId are required");
  }

  if (auth.role === ROLES.TEACHER) {
    const allowed = await canTeacherManageSubjectClass(
      auth.userId,
      body.subjectId,
      body.classId ?? null
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
    auth.role === ROLES.ADMIN ? body.teacherId : auth.userId;
  if (!teacherId) {
    return jsonError("VALIDATION_ERROR", "teacherId is required", 400);
  }

  const row = await prisma.material.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      subjectId: body.subjectId,
      classId: body.classId ?? null,
      teacherId,
    },
  });

  return jsonOk(row, { status: 201 });
}

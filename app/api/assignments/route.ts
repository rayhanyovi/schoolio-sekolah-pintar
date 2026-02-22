import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockAssignments } from "@/lib/mockData";
import { Prisma } from "@prisma/client";

const isTeacherAssignedToSubject = async (teacherId: string, subjectId: string) => {
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

const isSubjectLinkedToAllClasses = async (
  subjectId: string,
  classIds: string[]
) => {
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
  const status = searchParams.get("status");

  if (isMockEnabled()) {
    const data = mockAssignments.filter((item) => {
      const classMatch = classId ? item.classIds.includes(classId) : true;
      const subjectMatch = subjectId ? item.subjectId === subjectId : true;
      const teacherFilter =
        auth.role === ROLES.TEACHER ? auth.userId : teacherId;
      const teacherMatch = teacherFilter
        ? item.teacherId === teacherFilter
        : true;
      const statusMatch = status ? item.status === status : true;
      return classMatch && subjectMatch && teacherMatch && statusMatch;
    });
    return jsonOk(
      data.map((item) => ({
        ...item,
        kind: item.type,
        deliveryType: null,
        type: item.type,
        allowLateSubmission: false,
        lateUntil: null,
      }))
    );
  }

  const where: Record<string, unknown> = {};
  if (subjectId) where.subjectId = subjectId;
  if (teacherId) where.teacherId = teacherId;
  if (status) where.status = status;
  if (classId) {
    where.classes = { some: { classId } };
  }

  if (auth.role === ROLES.TEACHER) {
    where.teacherId = auth.userId;
  }

  if (auth.role === ROLES.STUDENT) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: auth.userId },
      select: { classId: true },
    });
    const ownClassId = profile?.classId ?? null;
    if (!ownClassId) {
      return jsonOk([]);
    }
    where.classes = { some: { classId: ownClassId } };
  }

  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonOk([]);
    }
    const profiles = await prisma.studentProfile.findMany({
      where: { userId: { in: linkedStudentIds } },
      select: { classId: true },
    });
    const classIds = Array.from(
      new Set(
        profiles
          .map((profile) => profile.classId)
          .filter((value): value is string => Boolean(value))
      )
    );
    if (!classIds.length) {
      return jsonOk([]);
    }
    where.classes = { some: { classId: { in: classIds } } };
  }

  const rows = await prisma.assignment.findMany({
    where: where as Prisma.AssignmentWhereInput,
    include: {
      subject: true,
      teacher: true,
      classes: true,
    },
    orderBy: { dueDate: "asc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    teacherId: row.teacherId,
    teacherName: row.teacher.name,
    classIds: row.classes.map((link) => link.classId),
    dueDate: row.dueDate,
    allowLateSubmission: row.allowLateSubmission,
    lateUntil: row.lateUntil,
    createdAt: row.createdAt,
    kind: row.kind,
    deliveryType: row.deliveryType,
    type: row.deliveryType ?? row.kind,
    status: row.status,
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.title || !body?.subjectId || !body?.dueDate) {
    return jsonError("VALIDATION_ERROR", "title, subjectId, dueDate are required");
  }
  const dueDate = new Date(body.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return jsonError("VALIDATION_ERROR", "dueDate is invalid");
  }
  const allowLateSubmission = Boolean(body.allowLateSubmission);
  const lateUntil =
    body.lateUntil === undefined || body.lateUntil === null || body.lateUntil === ""
      ? null
      : new Date(body.lateUntil);
  if (lateUntil && Number.isNaN(lateUntil.getTime())) {
    return jsonError("VALIDATION_ERROR", "lateUntil is invalid");
  }
  if (allowLateSubmission && !lateUntil) {
    return jsonError(
      "VALIDATION_ERROR",
      "lateUntil wajib diisi saat allowLateSubmission aktif",
      400
    );
  }
  if (allowLateSubmission && lateUntil && lateUntil.getTime() <= dueDate.getTime()) {
    return jsonError(
      "VALIDATION_ERROR",
      "lateUntil harus lebih besar dari dueDate",
      400
    );
  }
  const classIds: string[] = Array.isArray(body.classIds) ? body.classIds : [];

  const teacherId =
    auth.role === ROLES.ADMIN ? body.teacherId ?? auth.userId : auth.userId;

  if (auth.role === ROLES.TEACHER) {
    const hasSubjectAccess = await isTeacherAssignedToSubject(
      auth.userId,
      body.subjectId
    );
    if (!hasSubjectAccess) {
      return jsonError(
        "FORBIDDEN",
        "Guru tidak terdaftar sebagai pengampu mapel ini",
        403
      );
    }
    const hasClassAccess = await isSubjectLinkedToAllClasses(
      body.subjectId,
      classIds
    );
    if (!hasClassAccess) {
      return jsonError(
        "FORBIDDEN",
        "Kelas yang dipilih tidak sesuai relasi mapel",
        403
      );
    }
  }

  const row = await prisma.assignment.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      subjectId: body.subjectId,
      teacherId,
      dueDate,
      allowLateSubmission,
      lateUntil: allowLateSubmission ? lateUntil : null,
      kind: body.kind ?? null,
      deliveryType: body.deliveryType ?? body.type ?? null,
      status: body.status ?? "ACTIVE",
    },
  });

  if (classIds.length) {
    await prisma.assignmentClass.createMany({
      data: classIds.map((cid) => ({ assignmentId: row.id, classId: cid })),
      skipDuplicates: true,
    });
  }

  return jsonOk(row, { status: 201 });
}

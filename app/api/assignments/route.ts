import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockAssignments } from "@/lib/mockData";
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

  const teacherId =
    auth.role === ROLES.ADMIN ? body.teacherId ?? auth.userId : auth.userId;

  const row = await prisma.assignment.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      subjectId: body.subjectId,
      teacherId,
      dueDate: new Date(body.dueDate),
      kind: body.kind ?? null,
      deliveryType: body.deliveryType ?? body.type ?? null,
      status: body.status ?? "ACTIVE",
    },
  });

  const classIds: string[] = body.classIds ?? [];
  if (classIds.length) {
    await prisma.assignmentClass.createMany({
      data: classIds.map((cid) => ({ assignmentId: row.id, classId: cid })),
      skipDuplicates: true,
    });
  }

  return jsonOk(row, { status: 201 });
}

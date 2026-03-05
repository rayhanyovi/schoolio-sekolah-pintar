import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isMockEnabled,
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockSubjects } from "@/lib/mockData";
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
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (isMockEnabled()) {
    const data = mockSubjects.filter((item) => {
      const categoryMatch = category ? item.category === category : true;
      const queryMatch = q
        ? item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q)
        : true;
      return categoryMatch && queryMatch;
    });
    return jsonOk(data);
  }

  const where: Record<string, unknown> = { schoolId };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.subject.findMany({
    where: where as Prisma.SubjectWhereInput,
    include: {
      teachers: { include: { teacher: true } },
      classes: true,
    },
    orderBy: { name: "asc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    description: row.description ?? "",
    color: row.color ?? "bg-primary",
    teachers: row.teachers.map((link) => ({
      id: link.teacherId,
      name: link.teacher.name,
    })),
    classIds: row.classes.map((link) => link.classId),
    hoursPerWeek: row.hoursPerWeek,
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  if (!body?.name || !body?.code || !body?.category) {
    return jsonError("VALIDATION_ERROR", "name, code, and category are required");
  }

  const teacherIds: string[] = body.teacherIds ?? [];
  const classIds: string[] = body.classIds ?? [];
  if (teacherIds.length) {
    const teacherCount = await prisma.user.count({
      where: {
        id: { in: teacherIds },
        role: ROLES.TEACHER,
        schoolId,
      },
    });
    if (teacherCount !== teacherIds.length) {
      return jsonError("FORBIDDEN", "Ada guru lintas sekolah", 403);
    }
  }
  if (classIds.length) {
    const classCount = await prisma.class.count({
      where: {
        id: { in: classIds },
        schoolId,
      },
    });
    if (classCount !== classIds.length) {
      return jsonError("FORBIDDEN", "Ada kelas lintas sekolah", 403);
    }
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.subject.create({
      data: {
        schoolId,
        name: body.name,
        code: body.code,
        category: body.category,
        description: body.description ?? "",
        color: body.color ?? "bg-primary",
        hoursPerWeek: body.hoursPerWeek ?? 0,
      },
    });

    if (teacherIds.length) {
      await tx.subjectTeacher.createMany({
        data: teacherIds.map((teacherId) => ({
          subjectId: created.id,
          teacherId,
        })),
        skipDuplicates: true,
      });
    }

    if (classIds.length) {
      await tx.subjectClass.createMany({
        data: classIds.map((classId) => ({
          subjectId: created.id,
          classId,
        })),
        skipDuplicates: true,
      });
    }

    return created;
  });

  const data = {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    description: row.description ?? "",
    color: row.color ?? "bg-primary",
    teachers: [],
    classIds,
    hoursPerWeek: row.hoursPerWeek,
  };

  return jsonOk(data, { status: 201 });
}

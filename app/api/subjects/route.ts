import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
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

  const where: Record<string, unknown> = {};
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

  const body = await request.json();
  if (!body?.name || !body?.code || !body?.category) {
    return jsonError("VALIDATION_ERROR", "name, code, and category are required");
  }

  const row = await prisma.subject.create({
    data: {
      name: body.name,
      code: body.code,
      category: body.category,
      description: body.description ?? "",
      color: body.color ?? "bg-primary",
      hoursPerWeek: body.hoursPerWeek ?? 0,
    },
  });

  const teacherIds: string[] = body.teacherIds ?? [];
  const classIds: string[] = body.classIds ?? [];

  if (teacherIds.length) {
    await prisma.subjectTeacher.createMany({
      data: teacherIds.map((teacherId) => ({
        subjectId: row.id,
        teacherId,
      })),
      skipDuplicates: true,
    });
  }

  if (classIds.length) {
    await prisma.subjectClass.createMany({
      data: classIds.map((classId) => ({
        subjectId: row.id,
        classId,
      })),
      skipDuplicates: true,
    });
  }

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

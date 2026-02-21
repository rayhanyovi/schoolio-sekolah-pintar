import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockSubjects } from "@/lib/mockData";

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

  if (isMockEnabled()) {
    const item = mockSubjects.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Subject not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.subject.findUnique({
    where: { id: params.id },
    include: {
      teachers: { include: { teacher: true } },
      classes: true,
    },
  });
  if (!row) return jsonError("NOT_FOUND", "Subject not found", 404);

  const data = {
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
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  const row = await prisma.subject.update({
    where: { id: params.id },
    data: {
      name: body.name,
      code: body.code,
      category: body.category,
      description: body.description,
      color: body.color ?? "bg-primary",
      hoursPerWeek: body.hoursPerWeek,
    },
  });

  if (Array.isArray(body.teacherIds)) {
    await prisma.subjectTeacher.deleteMany({ where: { subjectId: row.id } });
    if (body.teacherIds.length) {
      await prisma.subjectTeacher.createMany({
        data: body.teacherIds.map((teacherId: string) => ({
          subjectId: row.id,
          teacherId,
        })),
        skipDuplicates: true,
      });
    }
  }

  if (Array.isArray(body.classIds)) {
    await prisma.subjectClass.deleteMany({ where: { subjectId: row.id } });
    if (body.classIds.length) {
      await prisma.subjectClass.createMany({
        data: body.classIds.map((classId: string) => ({
          subjectId: row.id,
          classId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const data = {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    description: row.description ?? "",
    color: row.color ?? "bg-primary",
    teachers: [],
    classIds: body.classIds ?? [],
    hoursPerWeek: row.hoursPerWeek,
  };

  return jsonOk(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  await prisma.subject.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

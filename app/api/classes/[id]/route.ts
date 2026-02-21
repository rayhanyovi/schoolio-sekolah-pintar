import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockClasses } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

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
  if (isMockEnabled()) {
    const item = mockClasses.find((row) => row.id === id);
    if (!item) return jsonError("NOT_FOUND", "Class not found", 404);
    return jsonOk({ ...item, major: item.major ?? "" });
  }

  const row = await prisma.class.findUnique({
    where: { id },
    include: { homeroomTeacher: true, academicYear: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Class not found", 404);

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId || ownClassId !== id) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke kelas ini", 403);
    }
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.includes(id)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke kelas ini", 403);
    }
  }

  const data = {
    id: row.id,
    name: row.name,
    grade: row.grade,
    major: row.major ?? "",
    section: row.section,
    homeroomTeacher: row.homeroomTeacher?.name ?? "",
    homeroomTeacherId: row.homeroomTeacherId ?? "",
    academicYear: row.academicYear?.year ?? "",
    studentCount: row.studentCount,
    maleCount: row.maleCount,
    femaleCount: row.femaleCount,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const body = await request.json();
  let academicYearId: string | null = body.academicYearId ?? null;
  if (!academicYearId && body.academicYear) {
    const year = await prisma.academicYear.findFirst({
      where: { year: body.academicYear },
      select: { id: true },
    });
    academicYearId = year?.id ?? null;
  }

  const row = await prisma.class.update({
    where: { id },
    data: {
      name: body.name,
      grade: body.grade,
      major: body.major ?? null,
      section: body.section,
      academicYearId,
      homeroomTeacherId: body.homeroomTeacherId,
      studentCount: body.studentCount,
      maleCount: body.maleCount,
      femaleCount: body.femaleCount,
    },
    include: { homeroomTeacher: true, academicYear: true },
  });

  const data = {
    id: row.id,
    name: row.name,
    grade: row.grade,
    major: row.major ?? "",
    section: row.section,
    homeroomTeacher: row.homeroomTeacher?.name ?? "",
    homeroomTeacherId: row.homeroomTeacherId ?? "",
    academicYear: row.academicYear?.year ?? "",
    studentCount: row.studentCount,
    maleCount: row.maleCount,
    femaleCount: row.femaleCount,
  };

  return jsonOk(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  await prisma.class.delete({ where: { id } });
  return jsonOk({ id });
}

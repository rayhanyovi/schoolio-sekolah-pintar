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
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  if (isMockEnabled()) {
    const item = mockClasses.find((row) => row.id === id);
    if (!item) return jsonError("NOT_FOUND", "Class not found", 404);
    return jsonOk({ ...item, major: item.major ?? "" });
  }

  const row = await prisma.class.findFirst({
    where: { id, schoolId },
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
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  let academicYearId: string | null = body.academicYearId ?? null;
  if (!academicYearId && body.academicYear) {
    const year = await prisma.academicYear.findFirst({
      where: { year: body.academicYear, schoolId },
      select: { id: true },
    });
    academicYearId = year?.id ?? null;
  }
  const existingClass = await prisma.class.findFirst({
    where: { id, schoolId },
    select: { id: true },
  });
  if (!existingClass) {
    return jsonError("NOT_FOUND", "Class not found", 404);
  }
  if (academicYearId) {
    const year = await prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
      select: { id: true },
    });
    if (!year) {
      return jsonError("FORBIDDEN", "Tahun ajaran tidak valid", 403);
    }
  }
  if (body.homeroomTeacherId) {
    const teacher = await prisma.user.findFirst({
      where: { id: body.homeroomTeacherId, role: ROLES.TEACHER, schoolId },
      select: { id: true },
    });
    if (!teacher) {
      return jsonError("FORBIDDEN", "Wali kelas tidak valid", 403);
    }
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
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const existing = await prisma.class.findFirst({
    where: { id, schoolId },
    select: { id: true },
  });
  if (!existing) {
    return jsonError("NOT_FOUND", "Class not found", 404);
  }
  await prisma.class.delete({ where: { id } });
  return jsonOk({ id });
}

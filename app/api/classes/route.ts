import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isMockEnabled,
  jsonError,
  jsonOk,
  parseJsonBody,
  parseNumber,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { resolveAcademicYearScope } from "@/lib/academic-year-scope";
import {
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockClasses } from "@/lib/mockData";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createClassSchema = z.object({
  name: z.string().trim().min(1, "name wajib diisi"),
  grade: z.coerce.number().int().min(1, "grade wajib berupa angka > 0"),
  major: z.string().trim().optional().nullable(),
  section: z.string().trim().min(1, "section wajib diisi"),
  academicYearId: z.string().trim().optional().nullable(),
  academicYear: z.string().trim().optional(),
  homeroomTeacherId: z.string().trim().optional().nullable(),
  studentCount: z.coerce.number().int().optional(),
  maleCount: z.coerce.number().int().optional(),
  femaleCount: z.coerce.number().int().optional(),
});

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
  const grade = parseNumber(searchParams.get("grade"));
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const yearScopeResult = await resolveAcademicYearScope(request, { schoolId });
  if (yearScopeResult.error) return yearScopeResult.error;
  const { academicYearId, includeAllAcademicYears } = yearScopeResult.scope;
  if (!includeAllAcademicYears && !academicYearId) {
    return jsonOk([]);
  }

  if (isMockEnabled()) {
    const data = mockClasses
      .filter((item) => {
      const gradeMatch = grade ? item.grade === grade : true;
      const queryMatch = q
        ? item.name.toLowerCase().includes(q) ||
          item.homeroomTeacher.toLowerCase().includes(q)
        : true;
      return gradeMatch && queryMatch;
      })
      .map((item) => ({
        ...item,
        major: item.major ?? "",
      }));
    return jsonOk(data);
  }

  const where: Record<string, unknown> = { schoolId };
  if (grade) where.grade = grade;
  if (academicYearId) where.academicYearId = academicYearId;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { homeroomTeacher: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId) {
      return jsonOk([]);
    }
    where.id = ownClassId;
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.length) {
      return jsonOk([]);
    }
    where.id = { in: linkedClassIds };
  }

  const rows = await prisma.class.findMany({
    where: where as Prisma.ClassWhereInput,
    include: { homeroomTeacher: true, academicYear: true },
    orderBy: { name: "asc" },
  });

  const data = rows.map((row) => ({
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

  const parsedBody = await parseJsonBody(request, createClassSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  let academicYearId: string | null = body.academicYearId ?? null;
  if (!academicYearId && body.academicYear) {
    const year = await prisma.academicYear.findFirst({
      where: { year: body.academicYear, schoolId },
      select: { id: true },
    });
    academicYearId = year?.id ?? null;
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
      where: {
        id: body.homeroomTeacherId,
        role: ROLES.TEACHER,
        schoolId,
      },
      select: { id: true },
    });
    if (!teacher) {
      return jsonError("FORBIDDEN", "Wali kelas tidak valid", 403);
    }
  }

  const row = await prisma.class.create({
    data: {
      schoolId,
      name: body.name,
      grade: body.grade,
      major: body.major ?? null,
      section: body.section,
      academicYearId,
      homeroomTeacherId: body.homeroomTeacherId ?? null,
      studentCount: body.studentCount ?? 0,
      maleCount: body.maleCount ?? 0,
      femaleCount: body.femaleCount ?? 0,
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

  return jsonOk(data, { status: 201 });
}

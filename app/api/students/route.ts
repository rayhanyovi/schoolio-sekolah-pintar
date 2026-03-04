import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { resolveAcademicYearScope } from "@/lib/academic-year-scope";
import { listLinkedStudentIds } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { Prisma, StudentLifecycleStatus } from "@prisma/client";

const STUDENT_LIFECYCLE_VALUES: StudentLifecycleStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "GRADUATED",
  "TRANSFERRED_OUT",
];

const toStudentLifecycleStatus = (
  value: string | null
): StudentLifecycleStatus | null => {
  if (!value) return null;
  const normalized = value.toUpperCase();
  return STUDENT_LIFECYCLE_VALUES.includes(normalized as StudentLifecycleStatus)
    ? (normalized as StudentLifecycleStatus)
    : null;
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
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const includeInactive = searchParams.get("includeInactive") === "true";
  const lifecycleStatusParam = searchParams.get("studentLifecycleStatus");
  const yearScopeResult = await resolveAcademicYearScope(request, { schoolId });
  if (yearScopeResult.error) return yearScopeResult.error;
  const { academicYearId, includeAllAcademicYears } = yearScopeResult.scope;
  if (!includeAllAcademicYears && !academicYearId) {
    return jsonOk([]);
  }
  const lifecycleStatus = toStudentLifecycleStatus(lifecycleStatusParam);
  if (lifecycleStatusParam && !lifecycleStatus) {
    return jsonError(
      "VALIDATION_ERROR",
      "studentLifecycleStatus tidak valid",
      400
    );
  }

  const where: Prisma.UserWhereInput = { role: "STUDENT", schoolId };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  const studentProfileWhere: Prisma.StudentProfileWhereInput = {};
  if (classId) {
    studentProfileWhere.classId = classId;
  }
  if (academicYearId) {
    studentProfileWhere.class = { academicYearId, schoolId };
  }
  if (lifecycleStatus) {
    studentProfileWhere.status = lifecycleStatus;
  } else if (!includeInactive) {
    studentProfileWhere.status = "ACTIVE";
  }
  if (Object.keys(studentProfileWhere).length) {
    where.studentProfile = studentProfileWhere;
  }

  if (auth.role === ROLES.STUDENT) {
    where.id = auth.userId;
  }

  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonOk([]);
    }
    where.id = { in: linkedStudentIds };
  }

  const rows = await prisma.user.findMany({
    where,
    include: { studentProfile: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import {
  jsonError,
  jsonOk,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { canViewStudent } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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

  const { id: studentId } = await params;
  if (!studentId) {
    return jsonError("VALIDATION_ERROR", "id is required", 400);
  }

  const allowed = await canViewStudent(auth, studentId);
  if (!allowed) {
    return jsonError("FORBIDDEN", "Student access out of scope", 403);
  }

  const rows = await prisma.studentClassEnrollment.findMany({
    where: {
      studentId,
      class: { schoolId },
    } as Prisma.StudentClassEnrollmentWhereInput,
    include: {
      class: { select: { name: true, section: true } },
      academicYear: { select: { year: true, semester: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    classId: row.classId,
    className: `${row.class.name} ${row.class.section}`.trim(),
    academicYearId: row.academicYearId,
    academicYear: row.academicYear
      ? `${row.academicYear.year} ${row.academicYear.semester}`
      : null,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    isActive: row.endedAt === null,
  }));

  return jsonOk(data);
}

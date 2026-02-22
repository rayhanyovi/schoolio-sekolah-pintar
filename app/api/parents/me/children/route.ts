import { NextRequest } from "next/server";
import { Prisma, StudentLifecycleStatus } from "@prisma/client";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { listLinkedStudentIds } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

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
  const roleError = requireRole(auth, [ROLES.PARENT]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.trim() ?? "";
  const includeInactive = searchParams.get("includeInactive") === "true";
  const lifecycleStatusParam = searchParams.get("studentLifecycleStatus");
  const lifecycleStatus = toStudentLifecycleStatus(lifecycleStatusParam);
  if (lifecycleStatusParam && !lifecycleStatus) {
    return jsonError(
      "VALIDATION_ERROR",
      "studentLifecycleStatus tidak valid",
      400
    );
  }

  const linkedStudentIds = await listLinkedStudentIds(auth.userId);
  if (!linkedStudentIds.length) {
    return jsonOk([]);
  }

  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    id: { in: linkedStudentIds },
  };

  const studentProfileWhere: Prisma.StudentProfileWhereInput = {};
  if (classId) {
    studentProfileWhere.classId = classId;
  }
  if (lifecycleStatus) {
    studentProfileWhere.status = lifecycleStatus;
  } else if (!includeInactive) {
    studentProfileWhere.status = "ACTIVE";
  }
  if (Object.keys(studentProfileWhere).length) {
    where.studentProfile = studentProfileWhere;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.user.findMany({
    where,
    include: { studentProfile: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}

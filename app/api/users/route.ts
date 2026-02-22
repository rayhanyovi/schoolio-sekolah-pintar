import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { resolveAcademicYearScope } from "@/lib/academic-year-scope";
import { ROLES } from "@/lib/constants";
import { Prisma, StudentLifecycleStatus } from "@prisma/client";

const STUDENT_LIFECYCLE_VALUES: StudentLifecycleStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "GRADUATED",
  "TRANSFERRED_OUT",
];

const toStudentLifecycleStatus = (
  value: unknown
): StudentLifecycleStatus | null => {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  return STUDENT_LIFECYCLE_VALUES.includes(normalized as StudentLifecycleStatus)
    ? (normalized as StudentLifecycleStatus)
    : null;
};

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const includeInactive = searchParams.get("includeInactive") === "true";
  const requestedStudentStatus = searchParams.get("studentLifecycleStatus");
  const yearScopeResult = await resolveAcademicYearScope(request);
  if (yearScopeResult.error) return yearScopeResult.error;
  const { academicYearId, includeAllAcademicYears } = yearScopeResult.scope;
  const studentStatus = requestedStudentStatus
    ? toStudentLifecycleStatus(requestedStudentStatus)
    : null;
  if (requestedStudentStatus && !studentStatus) {
    return jsonError(
      "VALIDATION_ERROR",
      "studentLifecycleStatus tidak valid",
      400
    );
  }

  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  const isStudentScopedQuery = role === "STUDENT" || Boolean(classId);
  if (isStudentScopedQuery) {
    if (!includeAllAcademicYears && !academicYearId) {
      return jsonOk([]);
    }
    const studentProfileWhere: Prisma.StudentProfileWhereInput = {};
    if (classId) {
      studentProfileWhere.classId = classId;
    }
    if (academicYearId) {
      studentProfileWhere.class = { academicYearId };
    }
    if (studentStatus) {
      studentProfileWhere.status = studentStatus;
    } else if (!includeInactive) {
      studentProfileWhere.status = "ACTIVE";
    }
    where.studentProfile = studentProfileWhere;
  }

  const rows = await prisma.user.findMany({
    where,
    include: { studentProfile: true, teacherProfile: true, parentProfile: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.name || !body?.role) {
    return jsonError("VALIDATION_ERROR", "name and role are required");
  }
  const studentLifecycleStatus =
    body.studentLifecycleStatus === undefined ||
    body.studentLifecycleStatus === null ||
    body.studentLifecycleStatus === ""
      ? "ACTIVE"
      : toStudentLifecycleStatus(body.studentLifecycleStatus);
  if (
    body.role === "STUDENT" &&
    body.studentLifecycleStatus !== undefined &&
    !studentLifecycleStatus
  ) {
    return jsonError(
      "VALIDATION_ERROR",
      "studentLifecycleStatus tidak valid",
      400
    );
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: body.name,
        email: body.email ?? null,
        role: body.role,
        phone: body.phone ?? null,
        address: body.address ?? null,
        bio: body.bio ?? null,
        avatarUrl: body.avatarUrl ?? null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
      },
    });

    if (body.role === "STUDENT") {
      const targetClassId = body.classId ?? null;
      await tx.studentProfile.create({
        data: {
          userId: created.id,
          classId: targetClassId,
          gender: body.gender ?? null,
          status: studentLifecycleStatus ?? "ACTIVE",
        },
      });
      if (targetClassId) {
        const classRow = await tx.class.findUnique({
          where: { id: targetClassId },
          select: { academicYearId: true },
        });
        await tx.studentClassEnrollment.create({
          data: {
            studentId: created.id,
            classId: targetClassId,
            academicYearId: classRow?.academicYearId ?? null,
          },
        });
      }
    }

    if (body.role === "TEACHER") {
      await tx.teacherProfile.create({ data: { userId: created.id } });
    }

    if (body.role === "PARENT") {
      await tx.parentProfile.create({ data: { userId: created.id } });
    }

    await tx.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action: "USER_CREATED",
        entityType: "User",
        entityId: created.id,
        beforeData: null,
        afterData: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
        },
      },
    });

    return created;
  });

  return jsonOk(row, { status: 201 });
}

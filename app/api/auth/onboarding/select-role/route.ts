import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { generateSchoolCode, normalizeSchoolCode } from "@/lib/school-code";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/server-auth";

const selectRoleSchema = z.object({
  name: z.string().trim().optional().nullable(),
  role: z.enum([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT]),
  schoolId: z.string().trim().optional().nullable(),
  schoolCode: z.string().trim().optional().nullable(),
  studentCode: z.string().trim().optional().nullable(),
});

const createSchoolForAdmin = async (tx: Prisma.TransactionClient) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const schoolCode = generateSchoolCode();
    try {
      const created = await tx.schoolProfile.create({
        data: {
          schoolCode,
          name: "",
          address: "",
          phone: "",
          email: "",
          website: "",
          principalName: "",
        },
        select: { id: true },
      });
      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("FAILED_TO_GENERATE_SCHOOL_CODE");
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const parsedBody = await parseJsonBody(request, selectRoleSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      schoolId: true,
      roleSelectedAt: true,
      onboardingCompletedAt: true,
    },
  });
  if (!user) {
    return jsonError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (user.onboardingCompletedAt) {
    return jsonError("CONFLICT", "Onboarding sudah selesai", 409);
  }
  if (user.roleSelectedAt) {
    return jsonError("CONFLICT", "Role sudah dipilih sebelumnya", 409);
  }
  let schoolId: string | null = null;
  let parentStudentId: string | null = null;
  if (body.role === ROLES.PARENT) {
    const normalizedStudentCode = body.studentCode?.trim() ?? "";
    if (!normalizedStudentCode) {
      return jsonError(
        "VALIDATION_ERROR",
        "studentCode wajib diisi untuk role orang tua",
        400
      );
    }
    const student = await prisma.user.findFirst({
      where: {
        id: normalizedStudentCode,
        role: ROLES.STUDENT,
        schoolId: { not: null },
      },
      select: {
        id: true,
        schoolId: true,
      },
    });
    if (!student?.schoolId) {
      return jsonError("FORBIDDEN", "Kode siswa tidak valid", 403);
    }
    schoolId = student.schoolId;
    parentStudentId = student.id;
  } else if (body.role !== ROLES.ADMIN) {
    const normalizedSchoolId = body.schoolId?.trim() ?? "";
    const normalizedSchoolCode = body.schoolCode
      ? normalizeSchoolCode(body.schoolCode)
      : "";
    if (!normalizedSchoolId && !normalizedSchoolCode) {
      return jsonError(
        "VALIDATION_ERROR",
        "schoolCode atau schoolId wajib diisi untuk role ini",
        400
      );
    }
    const school = normalizedSchoolId
      ? await prisma.schoolProfile.findUnique({
          where: { id: normalizedSchoolId },
          select: { id: true },
        })
      : await prisma.schoolProfile.findUnique({
          where: { schoolCode: normalizedSchoolCode },
          select: { id: true },
        });
    if (!school) {
      return jsonError("FORBIDDEN", "Kode sekolah tidak valid", 403);
    }
    schoolId = school.id;
  }
  if (body.role === ROLES.PARENT && !parentStudentId) {
    return jsonError("FORBIDDEN", "Kode siswa tidak valid", 403);
  }

  const selected = await prisma.$transaction(async (tx) => {
    let resolvedSchoolId = schoolId;
    if (body.role === ROLES.ADMIN) {
      const school = await createSchoolForAdmin(tx);
      resolvedSchoolId = school.id;
    }

    const updatedUser = await tx.user.update({
      where: { id: auth.userId },
      data: {
        name: body.name?.trim() || user.name || "",
        role: body.role,
        schoolId: resolvedSchoolId,
        roleSelectedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        role: true,
        schoolId: true,
      },
    });

    if (body.role === ROLES.TEACHER) {
      await tx.studentProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.parentProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.teacherProfile.upsert({
        where: { userId: auth.userId },
        update: {},
        create: { userId: auth.userId },
      });
    } else if (body.role === ROLES.STUDENT) {
      await tx.teacherProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.parentProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.studentProfile.upsert({
        where: { userId: auth.userId },
        update: {},
        create: { userId: auth.userId, status: "ACTIVE" },
      });
    } else if (body.role === ROLES.PARENT) {
      await tx.teacherProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.studentProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.parentProfile.upsert({
        where: { userId: auth.userId },
        update: {},
        create: { userId: auth.userId },
      });
      await tx.parentStudent.upsert({
        where: {
          parentId_studentId: {
            parentId: auth.userId,
            studentId: parentStudentId!,
          },
        },
        update: {},
        create: {
          parentId: auth.userId,
          studentId: parentStudentId!,
        },
      });
    } else if (body.role === ROLES.ADMIN) {
      await tx.teacherProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.studentProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.parentProfile.deleteMany({ where: { userId: auth.userId } });
      await tx.parentStudent.deleteMany({ where: { parentId: auth.userId } });
      await tx.parentStudent.deleteMany({ where: { studentId: auth.userId } });
    }

    return updatedUser;
  });

  const token = await createSessionToken({
    userId: selected.id,
    name: selected.name,
    role: selected.role,
    canUseDebugPanel: auth.canUseDebugPanel,
    onboardingCompleted: false,
    schoolId: selected.schoolId,
    mustChangePassword: false,
  });

  const response = jsonOk({
    user: selected,
    canUseDebugPanel: auth.canUseDebugPanel,
    onboardingCompleted: false,
    roleSelectionRequired: false,
    schoolId: selected.schoolId,
    mustChangePassword: false,
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}

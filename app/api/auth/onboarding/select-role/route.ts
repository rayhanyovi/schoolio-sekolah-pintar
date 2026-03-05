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
  name: z.string().trim().min(1, "name wajib diisi"),
  role: z.enum([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  schoolCode: z.string().trim().optional().nullable(),
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
  if (body.role !== ROLES.ADMIN) {
    const normalizedSchoolCode = body.schoolCode
      ? normalizeSchoolCode(body.schoolCode)
      : "";
    if (!normalizedSchoolCode) {
      return jsonError(
        "VALIDATION_ERROR",
        "schoolCode wajib diisi untuk role ini",
        400
      );
    }
    const school = await prisma.schoolProfile.findUnique({
      where: { schoolCode: normalizedSchoolCode },
      select: { id: true },
    });
    if (!school) {
      return jsonError("FORBIDDEN", "Kode sekolah tidak valid", 403);
    }
    schoolId = school.id;
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
        name: body.name.trim(),
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
  });

  const response = jsonOk({
    user: selected,
    canUseDebugPanel: auth.canUseDebugPanel,
    onboardingCompleted: false,
    roleSelectionRequired: false,
    schoolId: selected.schoolId,
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}

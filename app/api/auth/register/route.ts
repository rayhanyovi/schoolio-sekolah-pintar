import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { normalizeSchoolCode } from "@/lib/school-code";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/server-auth";
import { ROLES } from "@/lib/constants";

const registerSchema = z.object({
  name: z.string().trim().min(1, "name wajib diisi"),
  identifier: z.string().trim().min(1, "identifier wajib diisi"),
  password: z.string().min(8, "password minimal 8 karakter"),
  role: z.enum([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT]),
  schoolCode: z.string().trim().optional().nullable(),
  childStudentId: z.string().trim().optional().nullable(),
});

const normalizeIdentifier = (value: string) => value.trim().toLowerCase();
const isEmailIdentifier = (value: string) => value.includes("@");

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody(request, registerSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;
  const identifier = normalizeIdentifier(body.identifier);
  const normalizedSchoolCode = body.schoolCode
    ? normalizeSchoolCode(body.schoolCode)
    : "";
  const childStudentId = body.childStudentId?.trim() ?? "";

  if (!identifier) {
    return jsonError("VALIDATION_ERROR", "identifier wajib diisi", 400);
  }

  if (body.role === ROLES.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: ROLES.ADMIN },
    });
    if (adminCount > 0) {
      return jsonError(
        "CONFLICT",
        "Registrasi admin publik hanya tersedia untuk admin pertama",
        409
      );
    }
  } else {
    if (!normalizedSchoolCode) {
      return jsonError(
        "VALIDATION_ERROR",
        "schoolCode wajib diisi untuk role ini",
        400
      );
    }
    const school = await prisma.schoolProfile.findFirst({
      where: { schoolCode: normalizedSchoolCode },
      select: { id: true },
    });
    if (!school) {
      return jsonError("FORBIDDEN", "Kode sekolah tidak valid", 403);
    }
  }

  const existingCredential = await prisma.authCredential.findUnique({
    where: { identifier },
    select: { id: true },
  });
  if (existingCredential) {
    return jsonError("CONFLICT", "Identifier sudah terdaftar", 409);
  }

  if (childStudentId && body.role !== ROLES.PARENT) {
    return jsonError(
      "VALIDATION_ERROR",
      "childStudentId hanya valid untuk role parent",
      400
    );
  }

  try {
    const passwordResult = await hashPassword(body.password);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: body.name.trim(),
          role: body.role,
          email: isEmailIdentifier(identifier) ? identifier : null,
        },
        select: {
          id: true,
          name: true,
          role: true,
          onboardingCompletedAt: true,
        },
      });

      if (body.role === ROLES.TEACHER) {
        await tx.teacherProfile.create({ data: { userId: user.id } });
      } else if (body.role === ROLES.STUDENT) {
        await tx.studentProfile.create({
          data: { userId: user.id, status: "ACTIVE" },
        });
      } else if (body.role === ROLES.PARENT) {
        await tx.parentProfile.create({ data: { userId: user.id } });
      }

      await tx.authCredential.create({
        data: {
          userId: user.id,
          identifier,
          passwordHash: passwordResult.passwordHash,
          passwordSalt: passwordResult.passwordSalt,
        },
      });

      if (childStudentId && body.role === ROLES.PARENT) {
        const student = await tx.user.findFirst({
          where: { id: childStudentId, role: ROLES.STUDENT },
          select: { id: true },
        });
        if (!student) {
          throw new Error("CHILD_NOT_FOUND");
        }
        await tx.parentStudent.create({
          data: {
            parentId: user.id,
            studentId: student.id,
          },
        });
      }

      return user;
    });

    const token = await createSessionToken({
      userId: created.id,
      name: created.name,
      role: created.role,
      canUseDebugPanel: false,
      onboardingCompleted: false,
    });

    const response = jsonOk(
      {
        user: {
          id: created.id,
          name: created.name,
          role: created.role,
        },
        canUseDebugPanel: false,
        onboardingCompleted: false,
      },
      { status: 201 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "CHILD_NOT_FOUND") {
      return jsonError("NOT_FOUND", "Siswa tidak ditemukan", 404);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("CONFLICT", "Identifier sudah terdaftar", 409);
    }
    throw error;
  }
}

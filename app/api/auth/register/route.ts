import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { normalizeCredentialIdentifier } from "@/lib/auth-credential";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/server-auth";
import { ROLES } from "@/lib/constants";
import {
  hashParentInviteCode,
  normalizeParentInviteCode,
  isParentInviteExpired,
} from "@/lib/parent-invite-code";

const registerSchema = z.object({
  email: z.string().trim().email("email tidak valid"),
  password: z.string().min(8, "password minimal 8 karakter"),
  confirmPassword: z.string().min(8, "konfirmasi password minimal 8 karakter"),
  parentInviteCode: z.string().trim().optional().nullable(),
})
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok",
  });

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody(request, registerSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;
  const identifier = normalizeCredentialIdentifier(body.email);

  if (!identifier) {
    return jsonError("VALIDATION_ERROR", "email wajib diisi", 400);
  }

  try {
    const existingCredential = await prisma.authCredential.findUnique({
      where: { identifier },
      select: { id: true },
    });
    if (existingCredential) {
      return jsonError("CONFLICT", "Identifier sudah terdaftar", 409);
    }

    const rawParentInviteCode = body.parentInviteCode?.trim() ?? "";
    const hasParentInviteCode = rawParentInviteCode.length > 0;
    const passwordResult = await hashPassword(body.password);
    const created = await prisma.$transaction(async (tx) => {
      if (hasParentInviteCode) {
        const normalizedCode = normalizeParentInviteCode(rawParentInviteCode);
        if (!normalizedCode) {
          return null;
        }

        const parentInvite = await tx.parentInvite.findFirst({
          where: {
            codeHash: hashParentInviteCode(normalizedCode),
            isActive: true,
            redeemedAt: null,
          },
          select: {
            id: true,
            expiresAt: true,
            schoolId: true,
            student: {
              select: {
                id: true,
                name: true,
                role: true,
                schoolId: true,
              },
            },
          },
        });
        if (!parentInvite || isParentInviteExpired(parentInvite.expiresAt)) {
          return null;
        }
        if (
          parentInvite.student.role !== ROLES.STUDENT ||
          !parentInvite.schoolId ||
          parentInvite.student.schoolId !== parentInvite.schoolId
        ) {
          return null;
        }

        const user = await tx.user.create({
          data: {
            name: "",
            role: ROLES.PARENT,
            roleSelectedAt: new Date(),
            email: identifier,
            schoolId: parentInvite.schoolId,
          },
          select: {
            id: true,
            name: true,
            role: true,
            onboardingCompletedAt: true,
            schoolId: true,
          },
        });

        await tx.authCredential.create({
          data: {
            userId: user.id,
            identifier,
            passwordHash: passwordResult.passwordHash,
            passwordSalt: passwordResult.passwordSalt,
          },
        });

        await tx.parentProfile.create({
          data: {
            userId: user.id,
          },
        });

        await tx.parentStudent.create({
          data: {
            parentId: user.id,
            studentId: parentInvite.student.id,
          },
        });

        await tx.parentInvite.update({
          where: { id: parentInvite.id },
          data: {
            isActive: false,
            redeemedAt: new Date(),
            redeemedByUserId: user.id,
          },
        });

        return user;
      }

      const user = await tx.user.create({
        data: {
          name: "",
          role: ROLES.STUDENT,
          roleSelectedAt: null,
          email: identifier,
          schoolId: null,
        },
        select: {
          id: true,
          name: true,
          role: true,
          onboardingCompletedAt: true,
          schoolId: true,
        },
      });

      await tx.authCredential.create({
        data: {
          userId: user.id,
          identifier,
          passwordHash: passwordResult.passwordHash,
          passwordSalt: passwordResult.passwordSalt,
        },
      });

      return user;
    });
    if (!created) {
      return jsonError("FORBIDDEN", "Kode undangan orang tua tidak valid", 403);
    }

    const onboardingCompleted = Boolean(created.onboardingCompletedAt);
    const roleSelectionRequired =
      created.role !== ROLES.PARENT && !created.onboardingCompletedAt;

    const token = await createSessionToken({
      userId: created.id,
      name: created.name,
      role: created.role,
      canUseDebugPanel: false,
      onboardingCompleted,
      schoolId: created.schoolId ?? null,
      mustChangePassword: false,
    });

    const response = jsonOk(
      {
        user: {
          id: created.id,
          name: created.name,
          role: created.role,
        },
        canUseDebugPanel: false,
        onboardingCompleted,
        roleSelectionRequired,
        mustChangePassword: false,
      },
      { status: 201 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("CONFLICT", "Identifier sudah terdaftar", 409);
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return jsonError("CONFLICT", "Layanan database belum tersedia", 503);
    }
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return jsonError("CONFLICT", "Gagal mengakses database", 500);
    }
    throw error;
  }
}

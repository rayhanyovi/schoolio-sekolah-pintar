import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  jsonError,
  jsonOk,
  parseJsonBody,
  requireAuth,
  requireRole,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/server-auth";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "password saat ini wajib diisi"),
    newPassword: z.string().min(8, "password baru minimal 8 karakter"),
    confirmPassword: z
      .string()
      .min(8, "konfirmasi password minimal 8 karakter"),
  })
  .refine((payload) => payload.newPassword === payload.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok",
  });

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const parsedBody = await parseJsonBody(request, changePasswordSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  const credential = await prisma.authCredential.findUnique({
    where: { userId: auth.userId },
    select: {
      id: true,
      passwordSalt: true,
      passwordHash: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          schoolId: true,
          onboardingCompletedAt: true,
        },
      },
    },
  });
  if (!credential) {
    return jsonError("UNAUTHORIZED", "Akun belum memiliki kredensial login", 401);
  }

  const isCurrentPasswordValid = await verifyPassword(
    body.currentPassword,
    credential.passwordSalt,
    credential.passwordHash
  );
  if (!isCurrentPasswordValid) {
    return jsonError("UNAUTHORIZED", "Password saat ini tidak valid", 401);
  }

  const isSameAsCurrent = await verifyPassword(
    body.newPassword,
    credential.passwordSalt,
    credential.passwordHash
  );
  if (isSameAsCurrent) {
    return jsonError(
      "VALIDATION_ERROR",
      "Password baru harus berbeda dari password lama",
      400
    );
  }

  const password = await hashPassword(body.newPassword);
  await prisma.authCredential.update({
    where: { id: credential.id },
    data: {
      passwordHash: password.passwordHash,
      passwordSalt: password.passwordSalt,
      mustChangePassword: false,
      isDefaultPassword: false,
    },
  });

  const onboardingCompleted = Boolean(credential.user.onboardingCompletedAt);
  const token = await createSessionToken({
    userId: credential.user.id,
    name: credential.user.name,
    role: credential.user.role,
    canUseDebugPanel: auth.canUseDebugPanel,
    onboardingCompleted,
    schoolId: credential.user.schoolId,
    mustChangePassword: false,
  });

  const response = jsonOk({
    success: true,
    mustChangePassword: false,
    onboardingCompleted,
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}

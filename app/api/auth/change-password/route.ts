import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  jsonOk,
  parseJsonBody,
  requireAuth,
  requireRole,
} from "@/lib/api";
import { jsonAuthError, jsonUnexpectedAuthError } from "@/lib/auth-error-response";
import { recordAudit } from "@/lib/audit";
import { ROLES } from "@/lib/constants";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/server-auth";
import { invalidateOutstandingPasswordResetTokens } from "@/lib/password-reset";
import { enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import {
  DEMO_MODE_FORBIDDEN_MESSAGE,
  isDemoModeEnabled,
} from "@/lib/demo-mode";

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
  if (isDemoModeEnabled() && auth.isDemo) {
    return jsonAuthError(
      request,
      "change-password",
      "FORBIDDEN",
      DEMO_MODE_FORBIDDEN_MESSAGE,
      403,
      "demo_mode_enabled"
    );
  }
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;
  const rateLimitError = enforceRateLimit(
    request,
    RATE_LIMIT_POLICIES.authChangePassword,
    auth.userId
  );
  if (rateLimitError) return rateLimitError;

  const parsedBody = await parseJsonBody(request, changePasswordSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  try {
    const credential = await prisma.authCredential.findUnique({
      where: { userId: auth.userId },
      select: {
        id: true,
        passwordSalt: true,
        passwordHash: true,
        mustChangePassword: true,
        isDefaultPassword: true,
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
      return jsonAuthError(
        request,
        "change-password",
        "UNAUTHORIZED",
        "Akun belum memiliki kredensial login",
        401,
        "missing_credential"
      );
    }

    const isCurrentPasswordValid = await verifyPassword(
      body.currentPassword,
      credential.passwordSalt,
      credential.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return jsonAuthError(
        request,
        "change-password",
        "UNAUTHORIZED",
        "Password saat ini tidak valid",
        401,
        "current_password_invalid"
      );
    }

    const isSameAsCurrent = await verifyPassword(
      body.newPassword,
      credential.passwordSalt,
      credential.passwordHash
    );
    if (isSameAsCurrent) {
      return jsonAuthError(
        request,
        "change-password",
        "VALIDATION_ERROR",
        "Password baru harus berbeda dari password lama",
        400,
        "new_password_same_as_current"
      );
    }

    const password = await hashPassword(body.newPassword);
    await prisma.$transaction(async (tx) => {
      await tx.authCredential.update({
        where: { id: credential.id },
        data: {
          passwordHash: password.passwordHash,
          passwordSalt: password.passwordSalt,
          mustChangePassword: false,
          isDefaultPassword: false,
        },
      });

      await invalidateOutstandingPasswordResetTokens(tx, credential.id);

      await recordAudit(
        auth,
        {
          action: "AUTH_PASSWORD_CHANGED",
          entityType: "User",
          entityId: auth.userId,
          beforeData: {
            mustChangePassword: credential.mustChangePassword,
            isDefaultPassword: credential.isDefaultPassword,
          },
          afterData: {
            mustChangePassword: false,
            isDefaultPassword: false,
          },
          metadata: {
            credentialId: credential.id,
          },
        },
        tx
      );
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
  } catch (error) {
    return jsonUnexpectedAuthError(request, "change-password", error);
  }
}

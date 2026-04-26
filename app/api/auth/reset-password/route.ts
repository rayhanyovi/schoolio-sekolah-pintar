import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { isSaasMode } from "@/lib/app-mode";
import {
  hashPasswordResetToken,
  invalidateOutstandingPasswordResetTokens,
  isPasswordResetTokenExpired,
} from "@/lib/password-reset";
import { enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "token reset wajib diisi"),
    password: z.string().min(8, "password minimal 8 karakter"),
    confirmPassword: z
      .string()
      .min(8, "konfirmasi password minimal 8 karakter"),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok",
  });

export async function POST(request: NextRequest) {
  const rateLimitError = enforceRateLimit(
    request,
    RATE_LIMIT_POLICIES.authResetPassword
  );
  if (rateLimitError) return rateLimitError;

  if (!isSaasMode()) {
    return jsonError(
      "FORBIDDEN",
      "Reset password via email hanya tersedia di mode SaaS",
      403
    );
  }

  const parsedBody = await parseJsonBody(request, resetPasswordSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  const tokenHash = hashPasswordResetToken(body.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      credentialId: true,
      expiresAt: true,
      usedAt: true,
      credential: {
        select: {
          user: {
            select: {
              id: true,
              role: true,
              email: true,
            },
          },
        },
      },
    },
  });
  if (
    !resetToken ||
    resetToken.usedAt ||
    isPasswordResetTokenExpired(resetToken.expiresAt)
  ) {
    return jsonError("FORBIDDEN", "Token reset password tidak valid", 403);
  }

  const password = await hashPassword(body.password);
  await prisma.$transaction(async (tx) => {
    const usedAt = new Date();

    await tx.authCredential.update({
      where: { id: resetToken.credentialId },
      data: {
        passwordHash: password.passwordHash,
        passwordSalt: password.passwordSalt,
        mustChangePassword: false,
        isDefaultPassword: false,
      },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt },
    });

    await invalidateOutstandingPasswordResetTokens(tx, resetToken.credentialId, {
      usedAt,
      exceptTokenId: resetToken.id,
    });

    await recordAudit(
      {
        userId: resetToken.credential.user.id,
        role: resetToken.credential.user.role,
      },
      {
        action: "AUTH_PASSWORD_RESET_COMPLETED",
        entityType: "User",
        entityId: resetToken.credential.user.id,
        beforeData: null,
        afterData: {
          id: resetToken.credential.user.id,
          email: resetToken.credential.user.email,
          resetTokenId: resetToken.id,
        },
        metadata: {
          credentialId: resetToken.credentialId,
          tokenExpiresAt: resetToken.expiresAt,
        },
      },
      tx
    );
  });

  return jsonOk({ success: true });
}

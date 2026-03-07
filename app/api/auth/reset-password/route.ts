import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { isSaasMode } from "@/lib/app-mode";
import {
  hashPasswordResetToken,
  isPasswordResetTokenExpired,
} from "@/lib/password-reset";

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
      data: { usedAt: new Date() },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        credentialId: resetToken.credentialId,
        usedAt: null,
        id: { not: resetToken.id },
      },
      data: { usedAt: new Date() },
    });
  });

  return jsonOk({ success: true });
}

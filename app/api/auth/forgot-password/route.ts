import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { isSaasMode } from "@/lib/app-mode";
import { normalizeCredentialIdentifier } from "@/lib/auth-credential";
import {
  generatePasswordResetToken,
  getPasswordResetExpiry,
  hashPasswordResetToken,
  invalidateOutstandingPasswordResetTokens,
} from "@/lib/password-reset";
import { enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { isResendConfigured, sendPasswordResetEmail } from "@/lib/resend";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("email tidak valid"),
});

const SAAS_RESPONSE_MESSAGE =
  "Jika email terdaftar, tautan reset password sudah dikirim.";
const SELF_HOST_RESPONSE_MESSAGE =
  "Mode self-host: hubungi admin agar password Anda direset ke password default server.";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody(request, forgotPasswordSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;
  const identifier = normalizeCredentialIdentifier(body.email);
  const rateLimitError = enforceRateLimit(
    request,
    RATE_LIMIT_POLICIES.authForgotPassword,
    identifier
  );
  if (rateLimitError) return rateLimitError;

  if (!isSaasMode()) {
    return jsonOk({
      success: true,
      mode: "self_host",
      message: SELF_HOST_RESPONSE_MESSAGE,
    });
  }

  if (!isResendConfigured()) {
    return jsonError(
      "CONFLICT",
      "Layanan reset password belum dikonfigurasi",
      503
    );
  }

  const credential = await prisma.authCredential.findUnique({
    where: { identifier },
    select: {
      id: true,
      identifier: true,
    },
  });

  if (credential) {
    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = getPasswordResetExpiry();
    const appBaseUrl =
      process.env.APP_BASE_URL?.trim() || new URL(request.url).origin;
    const resetUrl = `${appBaseUrl.replace(/\/$/, "")}/auth?resetToken=${encodeURIComponent(rawToken)}`;

    await prisma.$transaction(async (tx) => {
      await invalidateOutstandingPasswordResetTokens(tx, credential.id);

      await tx.passwordResetToken.create({
        data: {
          credentialId: credential.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    const mailResult = await sendPasswordResetEmail({
      to: credential.identifier,
      resetUrl,
    });
    if (!mailResult.ok) {
      return jsonError("CONFLICT", "Gagal mengirim email reset password", 503);
    }
  }

  return jsonOk({
    success: true,
    mode: "saas",
    message: SAAS_RESPONSE_MESSAGE,
  });
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonOk, parseJsonBody } from "@/lib/api";
import { jsonAuthError, jsonUnexpectedAuthError } from "@/lib/auth-error-response";
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
import {
  DEMO_MODE_FORBIDDEN_MESSAGE,
  isDemoModeEnabled,
} from "@/lib/demo-mode";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("email tidak valid"),
});

const SAAS_RESPONSE_MESSAGE =
  "Jika email terdaftar, tautan reset password sudah dikirim.";
const SELF_HOST_RESPONSE_MESSAGE =
  "Mode self-host: hubungi admin agar password Anda direset ke password default server.";

export async function POST(request: NextRequest) {
  if (isDemoModeEnabled()) {
    return jsonAuthError(
      request,
      "forgot-password",
      "FORBIDDEN",
      DEMO_MODE_FORBIDDEN_MESSAGE,
      403,
      "demo_mode_enabled"
    );
  }

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
    return jsonAuthError(
      request,
      "forgot-password",
      "CONFLICT",
      "Layanan reset password belum dikonfigurasi",
      503,
      "resend_not_configured"
    );
  }

  try {
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
        return jsonAuthError(
          request,
          "forgot-password",
          "CONFLICT",
          "Gagal mengirim email reset password",
          503,
          "email_send_failed"
        );
      }
    }
  } catch (error) {
    return jsonUnexpectedAuthError(request, "forgot-password", error);
  }

  return jsonOk({
    success: true,
    mode: "saas",
    message: SAAS_RESPONSE_MESSAGE,
  });
}

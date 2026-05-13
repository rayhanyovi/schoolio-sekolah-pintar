import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk } from "@/lib/api";
import { jsonAuthError, jsonUnexpectedAuthError } from "@/lib/auth-error-response";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { normalizeCredentialIdentifier } from "@/lib/auth-credential";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/server-auth";
import { enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import {
  DEMO_MODE_FORBIDDEN_MESSAGE,
  isDemoModeEnabled,
} from "@/lib/demo-mode";

const loginSchema = z.object({
  username: z.string().trim().min(1).optional(),
  identifier: z.string().trim().min(1).optional(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (isDemoModeEnabled()) {
    return jsonAuthError(
      request,
      "login",
      "FORBIDDEN",
      DEMO_MODE_FORBIDDEN_MESSAGE,
      403,
      "demo_mode_enabled"
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonAuthError(
      request,
      "login",
      "VALIDATION_ERROR",
      "Invalid request payload",
      400,
      "invalid_json"
    );
  }

  const parsed = loginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonAuthError(
      request,
      "login",
      "VALIDATION_ERROR",
      "identifier and password are required",
      400,
      "schema_validation_failed"
    );
  }

  const identifierSource = parsed.data.identifier ?? parsed.data.username ?? "";
  const identifier = normalizeCredentialIdentifier(identifierSource);
  if (!identifier) {
    return jsonAuthError(
      request,
      "login",
      "VALIDATION_ERROR",
      "identifier and password are required",
      400,
      "missing_identifier"
    );
  }
  const rateLimitError = enforceRateLimit(
    request,
    RATE_LIMIT_POLICIES.authLogin,
    identifier
  );
  if (rateLimitError) return rateLimitError;

  try {
    const credential = await prisma.authCredential.findUnique({
      where: { identifier },
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
            onboardingCompletedAt: true,
            schoolId: true,
          },
        },
      },
    });
    if (!credential) {
      return jsonAuthError(
        request,
        "login",
        "UNAUTHORIZED",
        "Username atau kata sandi salah",
        401,
        "invalid_credentials"
      );
    }

    const isValidPassword = await verifyPassword(
      parsed.data.password,
      credential.passwordSalt,
      credential.passwordHash
    );
    if (!isValidPassword) {
      return jsonAuthError(
        request,
        "login",
        "UNAUTHORIZED",
        "Username atau kata sandi salah",
        401,
        "invalid_credentials"
      );
    }

    const onboardingCompleted = Boolean(credential.user.onboardingCompletedAt);
    const mustChangePassword =
      credential.mustChangePassword || credential.isDefaultPassword;

    const token = await createSessionToken({
      userId: credential.user.id,
      name: credential.user.name,
      role: credential.user.role,
      canUseDebugPanel: false,
      onboardingCompleted,
      schoolId: credential.user.schoolId,
      mustChangePassword,
    });

    const response = jsonOk({
      user: {
        id: credential.user.id,
        name: credential.user.name,
        role: credential.user.role,
      },
      canUseDebugPanel: false,
      onboardingCompleted,
      schoolId: credential.user.schoolId,
      mustChangePassword,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return response;
  } catch (error) {
    return jsonUnexpectedAuthError(request, "login", error);
  }
}

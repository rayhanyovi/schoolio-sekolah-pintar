import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { isSaasMode } from "@/lib/app-mode";
import { getDefaultUserPassword } from "@/lib/default-password";
import { hashPassword } from "@/lib/password";
import { normalizeCredentialIdentifier } from "@/lib/auth-credential";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const resolveTargetUserId = async (context: RouteContext) => {
  const params = await context.params;
  const id = params?.id?.trim();
  return id ? id : null;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  if (isSaasMode()) {
    return jsonError(
      "FORBIDDEN",
      "Reset ke password default hanya tersedia di mode self-host",
      403
    );
  }

  const targetUserId = await resolveTargetUserId(context);
  if (!targetUserId) {
    return jsonError("VALIDATION_ERROR", "User id tidak valid", 400);
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      schoolId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  if (!targetUser) {
    return jsonError("NOT_FOUND", "User tidak ditemukan", 404);
  }

  const identifier = targetUser.email
    ? normalizeCredentialIdentifier(targetUser.email)
    : "";
  if (!identifier) {
    return jsonError(
      "VALIDATION_ERROR",
      "User belum memiliki email untuk login",
      400
    );
  }

  const defaultPassword = getDefaultUserPassword();
  const password = await hashPassword(defaultPassword);

  try {
    await prisma.$transaction(async (tx) => {
      const credentialByIdentifier = await tx.authCredential.findUnique({
        where: { identifier },
        select: { id: true, userId: true },
      });
      if (
        credentialByIdentifier &&
        credentialByIdentifier.userId !== targetUser.id
      ) {
        throw new Error("CONFLICT_IDENTIFIER");
      }

      const credential = await tx.authCredential.upsert({
        where: { userId: targetUser.id },
        update: {
          identifier,
          passwordHash: password.passwordHash,
          passwordSalt: password.passwordSalt,
          mustChangePassword: true,
          isDefaultPassword: true,
        },
        create: {
          userId: targetUser.id,
          identifier,
          passwordHash: password.passwordHash,
          passwordSalt: password.passwordSalt,
          mustChangePassword: true,
          isDefaultPassword: true,
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          credentialId: credential.id,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action: "USER_PASSWORD_RESET_TO_DEFAULT",
          entityType: "User",
          entityId: targetUser.id,
          beforeData: null,
          afterData: {
            id: targetUser.id,
            role: targetUser.role,
            email: targetUser.email,
            mustChangePassword: true,
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CONFLICT_IDENTIFIER") {
      return jsonError("CONFLICT", "Email sudah dipakai akun lain", 409);
    }
    throw error;
  }

  return jsonOk({
    success: true,
    message:
      "Password user direset ke password default server. User wajib ganti password saat login.",
  });
}

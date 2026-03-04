import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildSchoolCodeFromId } from "@/lib/school-code";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/server-auth";

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

  if (auth.role === ROLES.ADMIN) {
    const schoolProfile = await prisma.schoolProfile.findFirst({
      select: {
        id: true,
        schoolCode: true,
        name: true,
        address: true,
        email: true,
      },
    });
    if (!schoolProfile?.name || !schoolProfile?.address || !schoolProfile?.email) {
      return jsonError(
        "VALIDATION_ERROR",
        "Profil sekolah wajib diisi sebelum onboarding admin selesai",
        400
      );
    }
    if (!schoolProfile.schoolCode) {
      await prisma.schoolProfile.update({
        where: { id: schoolProfile.id },
        data: { schoolCode: buildSchoolCodeFromId(schoolProfile.id) },
      });
    }
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: { onboardingCompletedAt: new Date() },
  });

  const token = await createSessionToken({
    userId: auth.userId,
    name: auth.name,
    role: auth.role,
    canUseDebugPanel: auth.canUseDebugPanel,
    onboardingCompleted: true,
  });

  const response = jsonOk({
    success: true,
    redirectTo: "/dashboard",
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}

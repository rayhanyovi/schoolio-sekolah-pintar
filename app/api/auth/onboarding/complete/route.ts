import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
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

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      roleSelectedAt: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
    },
  });
  if (!user?.roleSelectedAt) {
    return jsonError(
      "VALIDATION_ERROR",
      "Pilih role terlebih dahulu sebelum menyelesaikan onboarding",
      400
    );
  }
  const hasDisplayName = Boolean(
    user.name?.trim() || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
  );
  if (!hasDisplayName || !user.birthDate) {
    return jsonError(
      "VALIDATION_ERROR",
      "Lengkapi data diri (nama lengkap dan tanggal lahir) sebelum menyelesaikan onboarding",
      400
    );
  }

  if (auth.role === ROLES.ADMIN) {
    if (!auth.schoolId) {
      return jsonError("FORBIDDEN", "Akun admin belum memiliki sekolah", 403);
    }
    const schoolProfile = await prisma.schoolProfile.findUnique({
      where: { id: auth.schoolId },
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
    const [academicYearCount, subjectCount] = await Promise.all([
      prisma.academicYear.count({ where: { schoolId: auth.schoolId } }),
      prisma.subject.count({ where: { schoolId: auth.schoolId } }),
    ]);
    if (academicYearCount === 0) {
      return jsonError(
        "VALIDATION_ERROR",
        "Tahun ajaran wajib dibuat sebelum onboarding admin selesai",
        400
      );
    }
    if (subjectCount === 0) {
      return jsonError(
        "VALIDATION_ERROR",
        "Template mata pelajaran wajib dibuat sebelum onboarding admin selesai",
        400
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: auth.userId },
    data: { onboardingCompletedAt: new Date() },
    select: {
      id: true,
      name: true,
      role: true,
      schoolId: true,
    },
  });

  const token = await createSessionToken({
    userId: updatedUser.id,
    name: updatedUser.name,
    role: updatedUser.role,
    canUseDebugPanel: auth.canUseDebugPanel,
    onboardingCompleted: true,
    schoolId: updatedUser.schoolId ?? null,
    mustChangePassword: auth.mustChangePassword,
  });

  const response = jsonOk({
    success: true,
    redirectTo: "/dashboard",
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}

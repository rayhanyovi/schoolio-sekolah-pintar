import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isMockEnabled,
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockSchoolProfile } from "@/lib/mockData";
import { normalizeSchoolCode } from "@/lib/school-code";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  if (isMockEnabled()) {
    return jsonOk(mockSchoolProfile);
  }

  const row = await prisma.schoolProfile.findUnique({
    where: { id: schoolId },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  if (!body?.name || !body?.address || !body?.email) {
    return jsonError("VALIDATION_ERROR", "name, address, and email are required");
  }

  const schoolCode =
    typeof body.schoolCode === "string" && body.schoolCode.trim()
      ? normalizeSchoolCode(body.schoolCode)
      : undefined;
  const phone = typeof body.phone === "string" ? body.phone : "";
  const website = typeof body.website === "string" ? body.website : "";
  const principalName =
    typeof body.principalName === "string" ? body.principalName : "";
  const existing = await prisma.schoolProfile.findUnique({
    where: { id: schoolId },
    select: { id: true },
  });
  if (!existing) {
    return jsonError("NOT_FOUND", "Sekolah tidak ditemukan", 404);
  }

  try {
    const row = await prisma.schoolProfile.update({
      where: { id: schoolId },
      data: {
        schoolCode,
        name: body.name,
        address: body.address,
        phone,
        email: body.email,
        website,
        principalName,
        logoUrl: body.logoUrl,
      },
    });
    return jsonOk(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("CONFLICT", "Kode sekolah sudah digunakan", 409);
    }
    throw error;
  }
}


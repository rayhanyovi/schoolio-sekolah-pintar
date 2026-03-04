import { NextRequest } from "next/server";
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
import { mockAcademicYears } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
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

  const { id } = await params;

  if (isMockEnabled()) {
    const item = mockAcademicYears.find((row) => row.id === id);
    if (!item) return jsonError("NOT_FOUND", "Academic year not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.academicYear.findFirst({
    where: { id, schoolId },
  });
  if (!row) return jsonError("NOT_FOUND", "Academic year not found", 404);
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { id } = await params;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const existing = await prisma.academicYear.findFirst({
    where: { id, schoolId },
    select: { id: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Academic year not found", 404);
  const row = await prisma.$transaction(async (tx) => {
    if (body.isActive === true) {
      await tx.academicYear.updateMany({
        where: { schoolId, isActive: true },
        data: { isActive: false },
      });
    }
    return tx.academicYear.update({
      where: { id },
      data: {
        year: body.year,
        semester: body.semester,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isActive: body.isActive,
      },
    });
  });
  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { id } = await params;

  const existing = await prisma.academicYear.findFirst({
    where: { id, schoolId },
    select: { id: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Academic year not found", 404);
  await prisma.academicYear.delete({ where: { id } });
  return jsonOk({ id });
}

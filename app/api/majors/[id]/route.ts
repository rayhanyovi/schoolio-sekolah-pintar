import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  const row = await prisma.major.findFirst({ where: { id, schoolId } });
  if (!row) return jsonError("NOT_FOUND", "Major not found", 404);

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
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const existing = await prisma.major.findFirst({
    where: { id, schoolId },
    select: { id: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Major not found", 404);
  const code =
    typeof body?.code === "string" && body.code.trim()
      ? body.code.trim().toUpperCase()
      : undefined;
  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim()
      : undefined;
  const description =
    typeof body?.description === "string"
      ? body.description.trim() || null
      : undefined;

  const row = await prisma.major.update({
    where: { id },
    data: {
      code,
      name,
      description,
    },
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
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  const existing = await prisma.major.findFirst({
    where: { id, schoolId },
    select: { id: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Major not found", 404);
  await prisma.major.delete({ where: { id } });
  return jsonOk({ id });
}

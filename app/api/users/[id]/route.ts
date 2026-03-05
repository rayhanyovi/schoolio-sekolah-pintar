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
import { canAccessOwnUser } from "@/lib/authz";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const { id } = await params;
  if (!id) {
    return jsonOk(null);
  }
  if (!canAccessOwnUser(auth, id)) {
    return jsonError("FORBIDDEN", "You are not allowed to access this user", 403);
  }

  const row = await prisma.user.findFirst({
    where: { id, schoolId },
    include: { studentProfile: true, teacherProfile: true, parentProfile: true },
  });
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
  if (!id) {
    return jsonOk(null);
  }
  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const existing = await prisma.user.findFirst({
    where: { id, schoolId },
  });
  if (!existing) {
    return jsonError("NOT_FOUND", "User not found", 404);
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        phone: body.phone,
        address: body.address,
        bio: body.bio,
        avatarUrl: body.avatarUrl,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      },
    });
    const action = existing.role !== updated.role ? "USER_ROLE_CHANGED" : "USER_UPDATED";
    await tx.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action,
        entityType: "User",
        entityId: updated.id,
        beforeData: {
          name: existing.name,
          email: existing.email,
          role: existing.role,
          phone: existing.phone,
          address: existing.address,
          bio: existing.bio,
        },
        afterData: {
          name: updated.name,
          email: updated.email,
          role: updated.role,
          phone: updated.phone,
          address: updated.address,
          bio: updated.bio,
        },
      },
    });
    return updated;
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
  if (!id) {
    return jsonOk(null);
  }
  const existing = await prisma.user.findFirst({
    where: { id, schoolId },
  });
  if (!existing) {
    return jsonError("NOT_FOUND", "User not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action: "USER_DELETED",
        entityType: "User",
        entityId: id,
        beforeData: {
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
        afterData: null,
      },
    });
  });
  return jsonOk({ id });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { canAccessOwnUser } from "@/lib/authz";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) {
    return jsonOk(null);
  }
  if (!canAccessOwnUser(auth, id)) {
    return jsonError("FORBIDDEN", "You are not allowed to access this user", 403);
  }

  const row = await prisma.user.findUnique({
    where: { id },
    include: { studentProfile: true, teacherProfile: true, parentProfile: true },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) {
    return jsonOk(null);
  }
  const body = await request.json();
  const row = await prisma.user.update({
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
  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) {
    return jsonOk(null);
  }
  await prisma.user.delete({ where: { id } });
  return jsonOk({ id });
}

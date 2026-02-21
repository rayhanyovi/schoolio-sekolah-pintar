import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockSchoolProfile } from "@/lib/mockData";

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

  if (isMockEnabled()) {
    return jsonOk(mockSchoolProfile);
  }

  const row = await prisma.schoolProfile.findFirst();
  return jsonOk(row);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.name || !body?.address || !body?.email) {
    return jsonError("VALIDATION_ERROR", "name, address, and email are required");
  }

  const existing = await prisma.schoolProfile.findFirst({ select: { id: true } });

  const row = existing
    ? await prisma.schoolProfile.update({
        where: { id: existing.id },
        data: {
          name: body.name,
          address: body.address,
          phone: body.phone,
          email: body.email,
          website: body.website,
          principalName: body.principalName,
          logoUrl: body.logoUrl,
        },
      })
    : await prisma.schoolProfile.create({
        data: {
          name: body.name,
          address: body.address,
          phone: body.phone,
          email: body.email,
          website: body.website,
          principalName: body.principalName,
          logoUrl: body.logoUrl,
        },
      });

  return jsonOk(row);
}

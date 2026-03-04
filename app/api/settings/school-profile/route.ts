import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, parseJsonRecordBody, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockSchoolProfile } from "@/lib/mockData";
import { buildSchoolCodeFromId, normalizeSchoolCode } from "@/lib/school-code";

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

  let row = await prisma.schoolProfile.findFirst();
  if (row && !row.schoolCode) {
    row = await prisma.schoolProfile.update({
      where: { id: row.id },
      data: { schoolCode: buildSchoolCodeFromId(row.id) },
    });
  }
  return jsonOk(row);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  if (!body?.name || !body?.address || !body?.email) {
    return jsonError("VALIDATION_ERROR", "name, address, and email are required");
  }

  const requestedSchoolCode =
    typeof body.schoolCode === "string" && body.schoolCode.trim()
      ? normalizeSchoolCode(body.schoolCode)
      : null;
  const phone = typeof body.phone === "string" ? body.phone : "";
  const website = typeof body.website === "string" ? body.website : "";
  const principalName =
    typeof body.principalName === "string" ? body.principalName : "";
  const existing = await prisma.schoolProfile.findFirst({
    select: { id: true, schoolCode: true },
  });

  let row = existing
    ? await prisma.schoolProfile.update({
        where: { id: existing.id },
        data: {
          schoolCode:
            existing.schoolCode ??
            requestedSchoolCode ??
            buildSchoolCodeFromId(existing.id),
          name: body.name,
          address: body.address,
          phone,
          email: body.email,
          website,
          principalName,
          logoUrl: body.logoUrl,
        },
      })
    : await prisma.schoolProfile.create({
        data: {
          schoolCode: requestedSchoolCode,
          name: body.name,
          address: body.address,
          phone,
          email: body.email,
          website,
          principalName,
          logoUrl: body.logoUrl,
        },
      });

  if (!row.schoolCode) {
    row = await prisma.schoolProfile.update({
      where: { id: row.id },
      data: { schoolCode: buildSchoolCodeFromId(row.id) },
    });
  }

  return jsonOk(row);
}

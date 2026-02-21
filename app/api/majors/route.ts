import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockMajors } from "@/lib/mockData";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  if (isMockEnabled()) {
    return jsonOk(mockMajors);
  }

  const rows = await prisma.major.findMany({
    orderBy: { code: "asc" },
  });

  return jsonOk(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  const rawCode = typeof body?.code === "string" ? body.code.trim() : "";
  if (!rawCode) {
    return jsonError("VALIDATION_ERROR", "code is required");
  }

  const code = rawCode.toUpperCase();
  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim()
      : code;
  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  const row = await prisma.major.create({
    data: {
      code,
      name,
      description,
    },
  });

  return jsonOk(row, { status: 201 });
}

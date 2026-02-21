import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockAcademicYears } from "@/lib/mockData";

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
    return jsonOk(mockAcademicYears);
  }

  const rows = await prisma.academicYear.findMany({ orderBy: { startDate: "desc" } });
  return jsonOk(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.year || !body?.semester || !body?.startDate || !body?.endDate) {
    return jsonError("VALIDATION_ERROR", "year, semester, startDate, endDate are required");
  }

  const row = await prisma.academicYear.create({
    data: {
      year: body.year,
      semester: body.semester,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isActive: Boolean(body.isActive),
    },
  });

  return jsonOk(row, { status: 201 });
}

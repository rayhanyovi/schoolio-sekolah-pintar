import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, parseJsonBody, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockAcademicYears } from "@/lib/mockData";
import { z } from "zod";

const createAcademicYearSchema = z.object({
  year: z.string().trim().min(1, "year wajib diisi"),
  semester: z.enum(["ODD", "EVEN"]),
  startDate: z.string().trim().min(1, "startDate wajib diisi"),
  endDate: z.string().trim().min(1, "endDate wajib diisi"),
  isActive: z.boolean().optional(),
});

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

  const parsedBody = await parseJsonBody(request, createAcademicYearSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return jsonError("VALIDATION_ERROR", "startDate/endDate tidak valid", 400);
  }

  const row = await prisma.academicYear.create({
    data: {
      year: body.year,
      semester: body.semester,
      startDate,
      endDate,
      isActive: Boolean(body.isActive),
    },
  });

  return jsonOk(row, { status: 201 });
}

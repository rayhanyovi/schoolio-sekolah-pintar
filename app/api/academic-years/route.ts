import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockAcademicYears } from "@/lib/mockData";

export async function GET() {
  if (isMockEnabled()) {
    return jsonOk(mockAcademicYears);
  }

  const rows = await prisma.academicYear.findMany({ orderBy: { startDate: "desc" } });
  return jsonOk(rows);
}

export async function POST(request: NextRequest) {
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

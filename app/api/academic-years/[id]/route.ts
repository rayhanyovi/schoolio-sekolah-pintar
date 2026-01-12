import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockAcademicYears } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  if (isMockEnabled()) {
    const item = mockAcademicYears.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Academic year not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.academicYear.findUnique({ where: { id: params.id } });
  if (!row) return jsonError("NOT_FOUND", "Academic year not found", 404);
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.academicYear.update({
    where: { id: params.id },
    data: {
      year: body.year,
      semester: body.semester,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      isActive: body.isActive,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.academicYear.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

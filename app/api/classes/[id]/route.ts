import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockClasses } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  if (isMockEnabled()) {
    const item = mockClasses.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Class not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.class.findUnique({
    where: { id: params.id },
    include: { homeroomTeacher: true, academicYear: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Class not found", 404);

  const data = {
    id: row.id,
    name: row.name,
    grade: row.grade,
    section: row.section,
    homeroomTeacher: row.homeroomTeacher?.name ?? "",
    homeroomTeacherId: row.homeroomTeacherId ?? "",
    academicYear: row.academicYear?.year ?? "",
    studentCount: row.studentCount,
    maleCount: row.maleCount,
    femaleCount: row.femaleCount,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  let academicYearId: string | null = body.academicYearId ?? null;
  if (!academicYearId && body.academicYear) {
    const year = await prisma.academicYear.findFirst({
      where: { year: body.academicYear },
      select: { id: true },
    });
    academicYearId = year?.id ?? null;
  }

  const row = await prisma.class.update({
    where: { id: params.id },
    data: {
      name: body.name,
      grade: body.grade,
      section: body.section,
      academicYearId,
      homeroomTeacherId: body.homeroomTeacherId,
      studentCount: body.studentCount,
      maleCount: body.maleCount,
      femaleCount: body.femaleCount,
    },
    include: { homeroomTeacher: true, academicYear: true },
  });

  const data = {
    id: row.id,
    name: row.name,
    grade: row.grade,
    section: row.section,
    homeroomTeacher: row.homeroomTeacher?.name ?? "",
    homeroomTeacherId: row.homeroomTeacherId ?? "",
    academicYear: row.academicYear?.year ?? "",
    studentCount: row.studentCount,
    maleCount: row.maleCount,
    femaleCount: row.femaleCount,
  };

  return jsonOk(data);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.class.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, parseNumber } from "@/lib/api";
import { mockClasses } from "@/lib/mockData";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = parseNumber(searchParams.get("grade"));
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (isMockEnabled()) {
    const data = mockClasses
      .filter((item) => {
      const gradeMatch = grade ? item.grade === grade : true;
      const queryMatch = q
        ? item.name.toLowerCase().includes(q) ||
          item.homeroomTeacher.toLowerCase().includes(q)
        : true;
      return gradeMatch && queryMatch;
      })
      .map((item) => ({
        ...item,
        major: item.major ?? "",
      }));
    return jsonOk(data);
  }

  const where: Record<string, unknown> = {};
  if (grade) where.grade = grade;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { homeroomTeacher: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await prisma.class.findMany({
    where: where as Prisma.ClassWhereInput,
    include: { homeroomTeacher: true, academicYear: true },
    orderBy: { name: "asc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    name: row.name,
    grade: row.grade,
    major: row.major ?? "",
    section: row.section,
    homeroomTeacher: row.homeroomTeacher?.name ?? "",
    homeroomTeacherId: row.homeroomTeacherId ?? "",
    academicYear: row.academicYear?.year ?? "",
    studentCount: row.studentCount,
    maleCount: row.maleCount,
    femaleCount: row.femaleCount,
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.name || !body?.grade || !body?.section) {
    return jsonError("VALIDATION_ERROR", "name, grade, and section are required");
  }

  let academicYearId: string | null = body.academicYearId ?? null;
  if (!academicYearId && body.academicYear) {
    const year = await prisma.academicYear.findFirst({
      where: { year: body.academicYear },
      select: { id: true },
    });
    academicYearId = year?.id ?? null;
  }

  const row = await prisma.class.create({
    data: {
      name: body.name,
      grade: body.grade,
      major: body.major ?? null,
      section: body.section,
      academicYearId,
      homeroomTeacherId: body.homeroomTeacherId ?? null,
      studentCount: body.studentCount ?? 0,
      maleCount: body.maleCount ?? 0,
      femaleCount: body.femaleCount ?? 0,
    },
    include: { homeroomTeacher: true, academicYear: true },
  });

  const data = {
    id: row.id,
    name: row.name,
    grade: row.grade,
    major: row.major ?? "",
    section: row.section,
    homeroomTeacher: row.homeroomTeacher?.name ?? "",
    homeroomTeacherId: row.homeroomTeacherId ?? "",
    academicYear: row.academicYear?.year ?? "",
    studentCount: row.studentCount,
    maleCount: row.maleCount,
    femaleCount: row.femaleCount,
  };

  return jsonOk(data, { status: 201 });
}

import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockMajorTeachers, mockTeachers } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  if (isMockEnabled()) {
    const teacherIds = mockMajorTeachers[id] ?? [];
    const data = mockTeachers.filter((teacher) => teacherIds.includes(teacher.id));
    return jsonOk(data);
  }

  const rows = await prisma.majorTeacher.findMany({
    where: { majorId: id },
    include: { teacher: true },
    orderBy: { teacher: { name: "asc" } },
  });

  return jsonOk(rows.map((row) => row.teacher));
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  const body = await request.json();
  const teacherIds: string[] = body?.teacherIds ?? [];
  if (!Array.isArray(teacherIds)) {
    return jsonError("VALIDATION_ERROR", "teacherIds array is required");
  }

  await prisma.majorTeacher.deleteMany({ where: { majorId: id } });
  if (teacherIds.length) {
    await prisma.majorTeacher.createMany({
      data: teacherIds.map((teacherId) => ({
        majorId: id,
        teacherId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id, teacherIds });
}

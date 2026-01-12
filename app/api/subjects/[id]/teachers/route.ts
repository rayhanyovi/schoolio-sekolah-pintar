import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const body = await request.json();
  const teacherIds: string[] = body?.teacherIds ?? [];
  if (!Array.isArray(teacherIds)) {
    return jsonError("VALIDATION_ERROR", "teacherIds array is required");
  }

  await prisma.subjectTeacher.deleteMany({ where: { subjectId: params.id } });
  if (teacherIds.length) {
    await prisma.subjectTeacher.createMany({
      data: teacherIds.map((teacherId) => ({
        subjectId: params.id,
        teacherId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, teacherIds });
}

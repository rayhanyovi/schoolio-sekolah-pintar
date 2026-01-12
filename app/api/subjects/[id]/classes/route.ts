import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const body = await request.json();
  const classIds: string[] = body?.classIds ?? [];
  if (!Array.isArray(classIds)) {
    return jsonError("VALIDATION_ERROR", "classIds array is required");
  }

  await prisma.subjectClass.deleteMany({ where: { subjectId: params.id } });
  if (classIds.length) {
    await prisma.subjectClass.createMany({
      data: classIds.map((classId) => ({
        subjectId: params.id,
        classId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, classIds });
}

import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const body = await request.json();
  const classIds: string[] = body?.classIds ?? [];
  if (!Array.isArray(classIds)) {
    return jsonError("VALIDATION_ERROR", "classIds array is required");
  }

  await prisma.calendarEventClass.deleteMany({ where: { eventId: params.id } });
  if (classIds.length) {
    await prisma.calendarEventClass.createMany({
      data: classIds.map((classId) => ({
        eventId: params.id,
        classId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, classIds });
}

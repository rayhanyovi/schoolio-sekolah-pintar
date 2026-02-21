import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
    select: { createdById: true },
  });
  if (!event) return jsonError("NOT_FOUND", "Event not found", 404);
  if (auth.role === ROLES.TEACHER && event.createdById !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah event ini", 403);
  }

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

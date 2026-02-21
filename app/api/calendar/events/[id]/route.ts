import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isMockEnabled,
  jsonError,
  jsonOk,
  requireAuth,
  requireRole,
} from "@/lib/api";
import {
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockEvents } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
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
    const item = mockEvents.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Event not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
    include: { classes: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Event not found", 404);

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke event ini", 403);
    }
    const classIds = row.classes.map((link) => link.classId);
    if (classIds.length > 0 && !classIds.includes(ownClassId)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke event ini", 403);
    }
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    const classIds = row.classes.map((link) => link.classId);
    if (
      classIds.length > 0 &&
      !classIds.some((classId) => linkedClassIds.includes(classId))
    ) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke event ini", 403);
    }
  }

  const data = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    date: row.date,
    endDate: row.endDate ?? undefined,
    type: row.type,
    classIds: row.classes.map((link) => link.classId),
    isRecurring: row.isRecurring,
    createdBy: row.createdById ?? "",
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const existing = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
    select: { createdById: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Event not found", 404);
  if (auth.role === ROLES.TEACHER && existing.createdById !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah event ini", 403);
  }

  const body = await request.json();
  const row = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      date: body.date ? new Date(body.date) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      type: body.type,
      isRecurring: body.isRecurring,
    },
  });

  if (Array.isArray(body.classIds)) {
    await prisma.calendarEventClass.deleteMany({ where: { eventId: row.id } });
    if (body.classIds.length) {
      await prisma.calendarEventClass.createMany({
        data: body.classIds.map((cid: string) => ({
          eventId: row.id,
          classId: cid,
        })),
        skipDuplicates: true,
      });
    }
  }

  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const existing = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
    select: { createdById: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Event not found", 404);
  if (auth.role === ROLES.TEACHER && existing.createdById !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa menghapus event ini", 403);
  }

  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockEvents } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
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

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

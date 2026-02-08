import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const row = await prisma.classSchedule.findUnique({
    where: { id },
    include: { class: true, subject: true, teacher: true },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const body = await request.json();
  const row = await prisma.classSchedule.update({
    where: { id },
    data: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room,
      color: body.color,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  await prisma.classSchedule.delete({ where: { id } });
  return jsonOk({ id });
}

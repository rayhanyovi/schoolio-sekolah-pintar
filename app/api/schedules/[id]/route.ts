import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const row = await prisma.classSchedule.findUnique({
    where: { id: params.id },
    include: { class: true, subject: true, teacher: true },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.classSchedule.update({
    where: { id: params.id },
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
  await prisma.classSchedule.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

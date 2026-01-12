import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const row = await prisma.attendanceSession.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      subject: true,
      teacher: true,
      records: true,
    },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.attendanceSession.update({
    where: { id: params.id },
    data: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      scheduleId: body.scheduleId,
      date: body.date ? new Date(body.date) : undefined,
      startTime: body.startTime,
      endTime: body.endTime,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.attendanceSession.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

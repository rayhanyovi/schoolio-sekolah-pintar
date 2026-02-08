import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      class: true,
      subject: true,
      teacher: true,
      takenBy: true,
      records: true,
    },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  if (!id) {
    return jsonError("VALIDATION_ERROR", "id is required");
  }
  const row = await prisma.attendanceSession.update({
    where: { id },
    data: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      takenByTeacherId: body.takenByTeacherId,
      scheduleId: body.scheduleId,
      date: body.date ? new Date(body.date) : undefined,
      startTime: body.startTime,
      endTime: body.endTime,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.attendanceSession.delete({ where: { id } });
  return jsonOk({ id });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const teacherId = searchParams.get("teacherId");
  const dayOfWeek = searchParams.get("dayOfWeek");

  const where: any = {};
  if (classId) where.classId = classId;
  if (teacherId) where.teacherId = teacherId;
  if (dayOfWeek) where.dayOfWeek = dayOfWeek;

  const rows = await prisma.classSchedule.findMany({
    where,
    include: { class: true, subject: true, teacher: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const data = rows.map((row) => ({
    id: row.id,
    classId: row.classId,
    className: row.class?.name ?? "",
    subjectId: row.subjectId,
    subjectName: row.subject?.name ?? "",
    subjectCode: row.subject?.code ?? "",
    teacherId: row.teacherId ?? undefined,
    teacherName: row.teacher?.name ?? "",
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    room: row.room ?? "",
    color: row.color ?? row.subject?.color ?? "",
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.classId || !body?.subjectId || !body?.dayOfWeek) {
    return jsonError("VALIDATION_ERROR", "classId, subjectId, dayOfWeek are required");
  }

  const subject = await prisma.subject.findUnique({
    where: { id: body.subjectId },
    select: { color: true },
  });

  const row = await prisma.classSchedule.create({
    data: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId ?? null,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room ?? null,
      color: subject?.color ?? "bg-primary",
    },
  });

  return jsonOk(row, { status: 201 });
}

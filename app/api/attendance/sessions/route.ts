import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const date = searchParams.get("date");

  const where: any = {};
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (teacherId) where.teacherId = teacherId;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  const rows = await prisma.attendanceSession.findMany({
    where,
    include: { class: true, subject: true, teacher: true, takenBy: true },
    orderBy: { date: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    classId: row.classId,
    className: row.class.name,
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    teacherId: row.teacherId ?? undefined,
    teacherName: row.teacher?.name ?? "",
    takenByTeacherId: row.takenByTeacherId ?? undefined,
    takenByTeacherName: row.takenBy?.name ?? "",
    scheduleId: row.scheduleId ?? undefined,
    date: row.date,
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.classId || !body?.subjectId || !body?.date) {
    return jsonError("VALIDATION_ERROR", "classId, subjectId, date are required");
  }

  const row = await prisma.attendanceSession.create({
    data: {
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId ?? null,
      takenByTeacherId: body.takenByTeacherId ?? null,
      scheduleId: body.scheduleId ?? null,
      date: new Date(body.date),
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
    },
  });

  return jsonOk(row, { status: 201 });
}

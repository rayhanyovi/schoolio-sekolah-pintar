import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const subjectId = searchParams.get("subjectId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (subjectId) where.session = { subjectId };
  if (dateFrom || dateTo) {
    where.session = {
      ...(where.session ?? {}),
      date: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    };
  }

  const rows = await prisma.attendanceRecord.findMany({
    where,
    include: {
      student: true,
      session: { include: { class: true, subject: true } },
    },
    orderBy: { recordedAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    studentId: row.studentId,
    studentName: row.student.name,
    status: row.status,
    note: row.note ?? "",
    recordedAt: row.recordedAt,
    date: row.session.date,
    classId: row.session.classId,
    className: row.session.class.name,
    subjectId: row.session.subjectId,
    subjectName: row.session.subject.name,
  }));

  return jsonOk(data);
}

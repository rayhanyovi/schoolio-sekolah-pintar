import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (subjectId) where.assignment = { subjectId };
  if (classId) {
    where.assignment = {
      ...(where.assignment ?? {}),
      classes: { some: { classId } },
    };
  }

  const rows = await prisma.assignmentSubmission.findMany({
    where,
    include: {
      student: true,
      assignment: { include: { subject: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    assignmentId: row.assignmentId,
    assignmentTitle: row.assignment.title,
    subjectId: row.assignment.subjectId,
    subjectName: row.assignment.subject.name,
    studentId: row.studentId,
    studentName: row.student.name,
    status: row.status,
    grade: row.grade ?? null,
    submittedAt: row.submittedAt ?? undefined,
    createdAt: row.createdAt,
  }));

  return jsonOk(data);
}

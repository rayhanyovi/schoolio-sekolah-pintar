import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const rows = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    assignmentId: row.assignmentId,
    studentId: row.studentId,
    studentName: row.student.name,
    status: row.status,
    submittedAt: row.submittedAt ?? undefined,
    grade: row.grade ?? null,
    feedback: row.feedback ?? "",
    response: row.response ?? null,
    createdAt: row.createdAt,
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  if (!body?.studentId) {
    return jsonError("VALIDATION_ERROR", "studentId is required");
  }

  const row = await prisma.assignmentSubmission.create({
    data: {
      assignmentId: id,
      studentId: body.studentId,
      status: body.status ?? "PENDING",
      submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
      grade: body.grade ?? null,
      feedback: body.feedback ?? null,
      response: body.response ?? null,
    },
  });

  return jsonOk(row, { status: 201 });
}

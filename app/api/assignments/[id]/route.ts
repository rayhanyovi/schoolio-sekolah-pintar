import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockAssignments } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  if (isMockEnabled()) {
    const item = mockAssignments.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Assignment not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: { subject: true, teacher: true, classes: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Assignment not found", 404);

  const data = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    teacherId: row.teacherId,
    teacherName: row.teacher.name,
    classIds: row.classes.map((link) => link.classId),
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    type: row.kind,
    status: row.status,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.assignment.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      kind: body.type ?? body.kind,
      status: body.status,
    },
  });

  if (Array.isArray(body.classIds)) {
    await prisma.assignmentClass.deleteMany({ where: { assignmentId: row.id } });
    if (body.classIds.length) {
      await prisma.assignmentClass.createMany({
        data: body.classIds.map((cid: string) => ({
          assignmentId: row.id,
          classId: cid,
        })),
        skipDuplicates: true,
      });
    }
  }

  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.assignment.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

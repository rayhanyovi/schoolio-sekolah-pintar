import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockAssignments } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;

  if (isMockEnabled()) {
    const item = mockAssignments.find((row) => row.id === id);
    if (!item) return jsonError("NOT_FOUND", "Assignment not found", 404);
    return jsonOk({
      ...item,
      kind: item.type,
      deliveryType: null,
      type: item.type,
    });
  }

  const row = await prisma.assignment.findUnique({
    where: { id },
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
    kind: row.kind,
    deliveryType: row.deliveryType,
    type: row.deliveryType ?? row.kind,
    status: row.status,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const row = await prisma.assignment.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      kind: body.kind ?? undefined,
      deliveryType: body.deliveryType ?? body.type ?? undefined,
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
  const { id } = await params;
  await prisma.assignment.delete({ where: { id } });
  return jsonOk({ id });
}

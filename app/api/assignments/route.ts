import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockAssignments } from "@/lib/mockData";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const status = searchParams.get("status");

  if (isMockEnabled()) {
    const data = mockAssignments.filter((item) => {
      const classMatch = classId ? item.classIds.includes(classId) : true;
      const subjectMatch = subjectId ? item.subjectId === subjectId : true;
      const teacherMatch = teacherId ? item.teacherId === teacherId : true;
      const statusMatch = status ? item.status === status : true;
      return classMatch && subjectMatch && teacherMatch && statusMatch;
    });
    return jsonOk(
      data.map((item) => ({
        ...item,
        kind: item.type,
        deliveryType: null,
        type: item.type,
      }))
    );
  }

  const where: Record<string, unknown> = {};
  if (subjectId) where.subjectId = subjectId;
  if (teacherId) where.teacherId = teacherId;
  if (status) where.status = status;
  if (classId) {
    where.classes = { some: { classId } };
  }

  const rows = await prisma.assignment.findMany({
    where: where as Prisma.AssignmentWhereInput,
    include: {
      subject: true,
      teacher: true,
      classes: true,
    },
    orderBy: { dueDate: "asc" },
  });

  const data = rows.map((row) => ({
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
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.title || !body?.subjectId || !body?.teacherId || !body?.dueDate) {
    return jsonError("VALIDATION_ERROR", "title, subjectId, teacherId, dueDate are required");
  }

  const row = await prisma.assignment.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      dueDate: new Date(body.dueDate),
      kind: body.kind ?? null,
      deliveryType: body.deliveryType ?? body.type ?? null,
      status: body.status ?? "ACTIVE",
    },
  });

  const classIds: string[] = body.classIds ?? [];
  if (classIds.length) {
    await prisma.assignmentClass.createMany({
      data: classIds.map((cid) => ({ assignmentId: row.id, classId: cid })),
      skipDuplicates: true,
    });
  }

  return jsonOk(row, { status: 201 });
}

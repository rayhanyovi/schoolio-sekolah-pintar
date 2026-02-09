import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: Record<string, unknown> = {};
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (teacherId) where.teacherId = teacherId;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const rows = await prisma.material.findMany({
    where: where as Prisma.MaterialWhereInput,
    include: { subject: true, class: true, teacher: true, attachments: true },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    subject: row.subject.name,
    subjectId: row.subjectId,
    className: row.class?.name ?? "",
    classId: row.classId ?? undefined,
    teacher: row.teacher.name,
    teacherId: row.teacherId,
    createdAt: row.createdAt,
    attachments: row.attachments.map((file) => ({
      id: file.id,
      name: file.fileName,
      size: file.sizeLabel ?? "",
      type: file.fileType,
      url: file.url ?? undefined,
      storageKey: file.storageKey ?? undefined,
    })),
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.title || !body?.subjectId || !body?.teacherId) {
    return jsonError("VALIDATION_ERROR", "title, subjectId, teacherId are required");
  }

  const row = await prisma.material.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      subjectId: body.subjectId,
      classId: body.classId ?? null,
      teacherId: body.teacherId,
    },
  });

  return jsonOk(row, { status: 201 });
}

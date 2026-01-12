import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockNotes } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  if (isMockEnabled()) {
    const item = mockNotes.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Note not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.note.findUnique({
    where: { id: params.id },
    include: { subject: true, class: true, author: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Note not found", 404);

  const data = {
    id: row.id,
    title: row.title,
    content: row.content,
    subjectId: row.subjectId ?? undefined,
    subjectName: row.subject?.name ?? undefined,
    classId: row.classId ?? undefined,
    className: row.class?.name ?? undefined,
    authorId: row.authorId,
    authorName: row.author.name,
    visibility: row.visibility,
    isPinned: row.isPinned,
    color: row.color ?? "",
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.note.update({
    where: { id: params.id },
    data: {
      title: body.title,
      content: body.content,
      subjectId: body.subjectId,
      classId: body.classId,
      visibility: body.visibility,
      isPinned: body.isPinned,
      color: body.color,
      tags: body.tags,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.note.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

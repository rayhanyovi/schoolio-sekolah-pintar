import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockNotes } from "@/lib/mockData";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");
  const subjectId = searchParams.get("subjectId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (isMockEnabled()) {
    const data = mockNotes.filter((item) => {
      const visibilityMatch = visibility ? item.visibility === visibility : true;
      const subjectMatch = subjectId ? item.subjectId === subjectId : true;
      const queryMatch = q ? item.title.toLowerCase().includes(q) : true;
      return visibilityMatch && subjectMatch && queryMatch;
    });
    return jsonOk(data);
  }

  const where: Record<string, unknown> = {};
  if (visibility) where.visibility = visibility;
  if (subjectId) where.subjectId = subjectId;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const rows = await prisma.note.findMany({
    where: where as Prisma.NoteWhereInput,
    include: { subject: true, class: true, author: true },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  const data = rows.map((row) => ({
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
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.title || !body?.content || !body?.authorId) {
    return jsonError("VALIDATION_ERROR", "title, content, authorId are required");
  }

  const row = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content,
      subjectId: body.subjectId ?? null,
      classId: body.classId ?? null,
      authorId: body.authorId,
      visibility: body.visibility ?? "PRIVATE",
      isPinned: Boolean(body.isPinned),
      color: body.color ?? null,
      tags: body.tags ?? [],
    },
  });

  return jsonOk(row, { status: 201 });
}

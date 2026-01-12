import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockThreads } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  if (isMockEnabled()) {
    const item = mockThreads.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Thread not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.forumThread.findUnique({
    where: { id: params.id },
    include: { subject: true, author: true, class: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Thread not found", 404);

  const data = {
    id: row.id,
    title: row.title,
    content: row.content,
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    classId: row.classId ?? undefined,
    authorId: row.authorId,
    authorName: row.author.name,
    authorRole: row.authorRole,
    status: row.status,
    isPinned: row.isPinned,
    replyCount: row.replyCount,
    upvotes: row.upvotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.forumThread.update({
    where: { id: params.id },
    data: {
      title: body.title,
      content: body.content,
      status: body.status,
      isPinned: body.isPinned,
      upvotes: body.upvotes,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.forumThread.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

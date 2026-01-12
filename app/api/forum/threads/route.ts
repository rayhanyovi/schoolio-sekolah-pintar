import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockThreads } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (isMockEnabled()) {
    const data = mockThreads.filter((item) => {
      const subjectMatch = subjectId ? item.subjectId === subjectId : true;
      const statusMatch = status ? item.status === status : true;
      const queryMatch = q
        ? item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q)
        : true;
      return subjectMatch && statusMatch && queryMatch;
    });
    return jsonOk(data);
  }

  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.forumThread.findMany({
    where,
    include: { subject: true, author: true, class: true },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  const data = rows.map((row) => ({
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
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.title || !body?.content || !body?.subjectId || !body?.authorId) {
    return jsonError(
      "VALIDATION_ERROR",
      "title, content, subjectId, authorId are required"
    );
  }

  const row = await prisma.forumThread.create({
    data: {
      title: body.title,
      content: body.content,
      subjectId: body.subjectId,
      classId: body.classId ?? null,
      authorId: body.authorId,
      authorRole: body.authorRole ?? "STUDENT",
      status: body.status ?? "OPEN",
      isPinned: Boolean(body.isPinned),
    },
  });

  return jsonOk(row, { status: 201 });
}

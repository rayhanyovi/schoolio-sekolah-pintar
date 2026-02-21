import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockThreads } from "@/lib/mockData";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

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

  const where: Record<string, unknown> = {};
  if (subjectId) where.subjectId = subjectId;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.forumThread.findMany({
    where: where as Prisma.ForumThreadWhereInput,
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
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

  const body = await request.json();
  if (!body?.title || !body?.content || !body?.subjectId) {
    return jsonError(
      "VALIDATION_ERROR",
      "title, content, subjectId are required"
    );
  }

  const row = await prisma.forumThread.create({
    data: {
      title: body.title,
      content: body.content,
      subjectId: body.subjectId,
      classId: body.classId ?? null,
      authorId: auth.userId,
      authorRole: auth.role,
      status: body.status ?? "OPEN",
      isPinned: Boolean(body.isPinned),
    },
  });

  return jsonOk(row, { status: 201 });
}

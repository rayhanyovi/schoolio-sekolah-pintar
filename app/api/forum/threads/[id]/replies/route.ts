import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockReplies } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

  if (isMockEnabled()) {
    const data = mockReplies.filter((row) => row.threadId === params.id);
    return jsonOk(data);
  }

  const rows = await prisma.forumReply.findMany({
    where: { threadId: params.id },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    threadId: row.threadId,
    content: row.content,
    authorId: row.authorId,
    authorName: row.author.name,
    authorRole: row.authorRole,
    isAcceptedAnswer: row.isAcceptedAnswer,
    upvotes: row.upvotes,
    createdAt: row.createdAt,
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

  const thread = await prisma.forumThread.findUnique({
    where: { id: params.id },
    select: { status: true },
  });
  if (!thread) return jsonError("NOT_FOUND", "Thread not found", 404);

  const isModerator = auth.role === ROLES.ADMIN || auth.role === ROLES.TEACHER;
  if (thread.status === "LOCKED" && !isModerator) {
    return jsonError("FORBIDDEN", "Thread ini sedang dikunci", 403);
  }

  const body = await request.json();
  if (!body?.content || typeof body.content !== "string") {
    return jsonError("VALIDATION_ERROR", "content is required");
  }

  const row = await prisma.forumReply.create({
    data: {
      threadId: params.id,
      content: body.content,
      authorId: auth.userId,
      authorRole: auth.role,
      isAcceptedAnswer: Boolean(body.isAcceptedAnswer),
      upvotes: body.upvotes ?? 0,
    },
  });

  await prisma.forumThread.update({
    where: { id: params.id },
    data: { replyCount: { increment: 1 } },
  });

  return jsonOk(row, { status: 201 });
}

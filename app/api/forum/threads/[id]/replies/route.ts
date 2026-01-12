import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockReplies } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
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
  const body = await request.json();
  if (!body?.content || !body?.authorId) {
    return jsonError("VALIDATION_ERROR", "content and authorId are required");
  }

  const row = await prisma.forumReply.create({
    data: {
      threadId: params.id,
      content: body.content,
      authorId: body.authorId,
      authorRole: body.authorRole ?? "STUDENT",
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

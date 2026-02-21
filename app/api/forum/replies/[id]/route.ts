import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

  const existing = await prisma.forumReply.findUnique({
    where: { id: params.id },
    include: { thread: { select: { status: true } } },
  });
  if (!existing) return jsonError("NOT_FOUND", "Reply not found", 404);

  const isModerator = auth.role === ROLES.ADMIN || auth.role === ROLES.TEACHER;
  const isOwner = existing.authorId === auth.userId;
  if (existing.thread.status === "LOCKED" && !isModerator) {
    return jsonError("FORBIDDEN", "Thread ini sedang dikunci", 403);
  }
  if (!isModerator && !isOwner) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah reply ini", 403);
  }

  const body = await request.json();
  const data: {
    content?: string;
    isAcceptedAnswer?: boolean;
    upvotes?: number;
  } = {};

  if (typeof body.content === "string") {
    data.content = body.content;
  }
  if (isModerator && typeof body.isAcceptedAnswer === "boolean") {
    data.isAcceptedAnswer = body.isAcceptedAnswer;
  }
  if (isModerator && typeof body.upvotes === "number") {
    data.upvotes = body.upvotes;
  }

  if (!Object.keys(data).length) {
    return jsonError("VALIDATION_ERROR", "No valid fields to update");
  }

  const row = await prisma.forumReply.update({
    where: { id: params.id },
    data,
  });
  return jsonOk(row);
}

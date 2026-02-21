import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockQuestions } from "@/lib/questionTypes";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  if (isMockEnabled()) {
    const item = mockQuestions.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Question not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.question.findUnique({
    where: { id: params.id },
    include: { subject: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Question not found", 404);

  const data = {
    id: row.id,
    type: row.type,
    subject: row.subject?.name ?? row.subjectText ?? "",
    topic: row.topic,
    difficulty: row.difficulty,
    text: row.text,
    options: row.options,
    correctAnswers: row.correctAnswers,
    rubric: row.rubric ?? undefined,
    allowedFormats: row.allowedFormats,
    points: row.points,
    createdAt: row.createdAt,
    usageCount: row.usageCount,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  const subjectId = body.subjectId ?? null;
  const row = await prisma.question.update({
    where: { id: params.id },
    data: {
      type: body.type,
      subjectId,
      subjectText: subjectId ? null : body.subject ?? null,
      topic: body.topic,
      difficulty: body.difficulty,
      text: body.text,
      options: body.options,
      correctAnswers: body.correctAnswers,
      rubric: body.rubric,
      allowedFormats: body.allowedFormats,
      points: body.points,
    },
  });

  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  await prisma.question.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}

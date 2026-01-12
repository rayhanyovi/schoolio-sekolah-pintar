import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockQuestions } from "@/lib/questionTypes";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const type = searchParams.get("type");
  const difficulty = searchParams.get("difficulty");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (isMockEnabled()) {
    const data = mockQuestions.filter((item) => {
      const subjectMatch = subject ? item.subject === subject : true;
      const typeMatch = type ? item.type === type : true;
      const difficultyMatch = difficulty ? item.difficulty === difficulty : true;
      const queryMatch = q
        ? item.text.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
        : true;
      return subjectMatch && typeMatch && difficultyMatch && queryMatch;
    });
    return jsonOk(data);
  }

  const where: any = {};
  if (type) where.type = type;
  if (difficulty) where.difficulty = difficulty;
  if (q) {
    where.OR = [
      { text: { contains: q, mode: "insensitive" } },
      { topic: { contains: q, mode: "insensitive" } },
    ];
  }
  if (subject) {
    where.OR = [
      ...(where.OR ?? []),
      { subject: { name: { equals: subject } } },
      { subjectText: { equals: subject } },
    ];
  }

  const rows = await prisma.question.findMany({
    where,
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
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
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.type || !body?.topic || !body?.difficulty || !body?.text) {
    return jsonError("VALIDATION_ERROR", "type, topic, difficulty, text are required");
  }

  const subjectId = body.subjectId ?? null;
  const row = await prisma.question.create({
    data: {
      type: body.type,
      subjectId,
      subjectText: subjectId ? null : body.subject ?? null,
      topic: body.topic,
      difficulty: body.difficulty,
      text: body.text,
      options: body.options ?? [],
      correctAnswers: body.correctAnswers ?? [],
      rubric: body.rubric ?? null,
      allowedFormats: body.allowedFormats ?? [],
      points: body.points ?? 0,
      usageCount: 0,
    },
  });

  return jsonOk(row, { status: 201 });
}

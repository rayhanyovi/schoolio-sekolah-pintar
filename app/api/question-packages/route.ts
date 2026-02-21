import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockPackages } from "@/lib/questionTypes";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (isMockEnabled()) {
    const data = mockPackages.filter((item) => {
      const subjectMatch = subject ? item.subject === subject : true;
      const queryMatch = q
        ? item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        : true;
      return subjectMatch && queryMatch;
    });
    return jsonOk(data);
  }

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (subject) {
    where.OR = [
      ...(where.OR ?? []),
      { subject: { name: { equals: subject } } },
      { subjectText: { equals: subject } },
    ];
  }

  const rows = await prisma.questionPackage.findMany({
    where: where as Prisma.QuestionPackageWhereInput,
    include: { items: true, subject: true },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    subject: row.subject?.name ?? row.subjectText ?? "",
    questionIds: row.items
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((item) => item.questionId),
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt ?? undefined,
    usageCount: row.usageCount,
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.name) {
    return jsonError("VALIDATION_ERROR", "name is required");
  }

  const subjectId = body.subjectId ?? null;
  const row = await prisma.questionPackage.create({
    data: {
      name: body.name,
      description: body.description ?? "",
      subjectId,
      subjectText: subjectId ? null : body.subject ?? null,
      lastUsedAt: body.lastUsedAt ? new Date(body.lastUsedAt) : null,
      usageCount: body.usageCount ?? 0,
    },
  });

  const questionIds: string[] = body.questionIds ?? [];
  if (questionIds.length) {
    await prisma.questionPackageItem.createMany({
      data: questionIds.map((questionId, index) => ({
        packageId: row.id,
        questionId,
        position: index + 1,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk(row, { status: 201 });
}

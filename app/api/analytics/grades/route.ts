import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const rows = await prisma.assignmentSubmission.findMany({
    where,
    include: { assignment: { include: { subject: true } } },
  });

  const aggregates = new Map<
    string,
    { subjectId: string; subjectName: string; total: number; count: number }
  >();

  for (const row of rows) {
    if (row.grade === null || row.grade === undefined) continue;
    const subjectId = row.assignment.subjectId;
    const existing = aggregates.get(subjectId);
    if (existing) {
      existing.total += row.grade;
      existing.count += 1;
    } else {
      aggregates.set(subjectId, {
        subjectId,
        subjectName: row.assignment.subject.name,
        total: row.grade,
        count: 1,
      });
    }
  }

  const data = Array.from(aggregates.values()).map((entry) => ({
    subjectId: entry.subjectId,
    subjectName: entry.subjectName,
    average: entry.count ? entry.total / entry.count : 0,
    submissions: entry.count,
  }));

  return jsonOk({ from, to, data });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  if (auth.role === ROLES.TEACHER) {
    where.assignment = { teacherId: auth.userId };
  }

  const rows = await prisma.assignmentSubmission.findMany({
    where: where as Prisma.AssignmentSubmissionWhereInput,
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

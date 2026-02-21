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
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  const where: Record<string, unknown> = {};
  if (subjectId) where.assignment = { subjectId };
  if (classId) {
    where.assignment = {
      ...(where.assignment ?? {}),
      classes: { some: { classId } },
    };
  }
  if (auth.role === ROLES.TEACHER) {
    where.assignment = {
      ...(where.assignment ?? {}),
      teacherId: auth.userId,
    };
  }

  const rows = await prisma.assignmentSubmission.findMany({
    where: where as Prisma.AssignmentSubmissionWhereInput,
    include: { student: true },
  });

  const aggregates = new Map<
    string,
    { studentId: string; studentName: string; total: number; count: number }
  >();

  for (const row of rows) {
    if (row.grade === null || row.grade === undefined) continue;
    const existing = aggregates.get(row.studentId);
    if (existing) {
      existing.total += row.grade;
      existing.count += 1;
    } else {
      aggregates.set(row.studentId, {
        studentId: row.studentId,
        studentName: row.student.name,
        total: row.grade,
        count: 1,
      });
    }
  }

  const data = Array.from(aggregates.values()).map((entry) => ({
    studentId: entry.studentId,
    studentName: entry.studentName,
    average: entry.count ? entry.total / entry.count : 0,
    assignments: entry.count,
  }));

  return jsonOk(data);
}

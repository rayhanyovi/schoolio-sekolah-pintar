import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (subjectId) where.assignment = { subjectId };
  if (classId) {
    where.assignment = {
      ...(where.assignment ?? {}),
      classes: { some: { classId } },
    };
  }

  if (auth.role === ROLES.STUDENT) {
    where.studentId = auth.userId;
  }

  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonOk([]);
    }
    if (studentId && !linkedStudentIds.includes(studentId)) {
      return jsonError("FORBIDDEN", "Student access out of scope", 403);
    }
    where.studentId = studentId
      ? studentId
      : { in: linkedStudentIds };
  }

  const rows = await prisma.assignmentSubmission.findMany({
    where: where as Prisma.AssignmentSubmissionWhereInput,
    include: {
      student: true,
      assignment: { include: { subject: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    assignmentId: row.assignmentId,
    assignmentTitle: row.assignment.title,
    subjectId: row.assignment.subjectId,
    subjectName: row.assignment.subject.name,
    studentId: row.studentId,
    studentName: row.student.name,
    status: row.status,
    grade: row.grade ?? null,
    submittedAt: row.submittedAt ?? undefined,
    createdAt: row.createdAt,
  }));

  return jsonOk(data);
}

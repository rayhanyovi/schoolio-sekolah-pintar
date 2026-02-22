import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
import { canSubmitAssignmentAt } from "@/lib/assignment-policy";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const { id } = await params;
  const where: Record<string, unknown> = { assignmentId: id };

  if (auth.role === ROLES.STUDENT) {
    where.studentId = auth.userId;
  }

  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonOk([]);
    }
    where.studentId = { in: linkedStudentIds };
  }

  if (auth.role === ROLES.TEACHER) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { teacherId: true },
    });
    if (!assignment || assignment.teacherId !== auth.userId) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke submission ini", 403);
    }
  }

  const rows = await prisma.assignmentSubmission.findMany({
    where,
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    assignmentId: row.assignmentId,
    studentId: row.studentId,
    studentName: row.student.name,
    status: row.status,
    submittedAt: row.submittedAt ?? undefined,
    grade: row.grade ?? null,
    feedback: row.feedback ?? "",
    response: auth.role === ROLES.PARENT ? null : row.response ?? null,
    createdAt: row.createdAt,
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.STUDENT]);
  if (roleError) return roleError;

  const { id } = await params;
  const body = await request.json();
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: {
      id: true,
      dueDate: true,
      allowLateSubmission: true,
      lateUntil: true,
    },
  });
  if (!assignment) {
    return jsonError("NOT_FOUND", "Assignment not found", 404);
  }
  const submitWindow = canSubmitAssignmentAt({
    dueDate: assignment.dueDate,
    allowLateSubmission: assignment.allowLateSubmission,
    lateUntil: assignment.lateUntil,
  });
  if (!submitWindow.allowed) {
    return jsonError("CONFLICT", submitWindow.reason ?? "Submission ditolak", 409);
  }

  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: auth.userId,
        },
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    const saved = await tx.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: auth.userId,
        },
      },
      update: {
        status: body.status ?? "SUBMITTED",
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
        response: body.response ?? null,
      },
      create: {
        assignmentId: id,
        studentId: auth.userId,
        status: body.status ?? "SUBMITTED",
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
        response: body.response ?? null,
      },
    });

    const shouldLogLifecycle =
      !existing ||
      existing.status !== saved.status ||
      (existing.submittedAt?.getTime() ?? null) !==
        (saved.submittedAt?.getTime() ?? null);
    if (shouldLogLifecycle) {
      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action: existing ? "SUBMISSION_STATUS_CHANGED" : "SUBMISSION_CREATED",
          entityType: "AssignmentSubmission",
          entityId: saved.id,
          beforeData: existing
            ? {
                status: existing.status,
                submittedAt: existing.submittedAt,
              }
            : null,
          afterData: {
            status: saved.status,
            submittedAt: saved.submittedAt,
          },
          metadata: {
            assignmentId: saved.assignmentId,
            studentId: saved.studentId,
          },
        },
      });
    }

    return saved;
  });

  return jsonOk(row, { status: 200 });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { canSubmitAssignmentAt } from "@/lib/assignment-policy";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]);
  if (roleError) return roleError;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const existing = await prisma.assignmentSubmission.findUnique({
    where: { id },
    include: {
      assignment: {
        select: {
          teacherId: true,
          dueDate: true,
          allowLateSubmission: true,
          lateUntil: true,
        },
      },
    },
  });
  if (!existing) {
    return jsonError("NOT_FOUND", "Submission not found", 404);
  }

  if (auth.role === ROLES.STUDENT && existing.studentId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah submission ini", 403);
  }
  if (
    auth.role === ROLES.TEACHER &&
    existing.assignment.teacherId !== auth.userId
  ) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah submission ini", 403);
  }

  const requestedStatus =
    typeof body.status === "string" ? body.status : undefined;
  if (
    requestedStatus !== undefined &&
    !["PENDING", "SUBMITTED", "GRADED"].includes(requestedStatus)
  ) {
    return jsonError("VALIDATION_ERROR", "Status submission tidak valid", 400);
  }
  const isGradeMutationRequested =
    body.grade !== undefined ||
    body.feedback !== undefined ||
    requestedStatus === "GRADED";
  if (auth.role === ROLES.STUDENT && isGradeMutationRequested) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah penilaian submission", 403);
  }
  if (
    auth.role === ROLES.STUDENT &&
    requestedStatus !== undefined &&
    requestedStatus !== "SUBMITTED"
  ) {
    return jsonError("FORBIDDEN", "Status submission tidak valid untuk siswa", 403);
  }

  const status =
    requestedStatus !== undefined
      ? requestedStatus
      : auth.role === ROLES.STUDENT
        ? "SUBMITTED"
        : undefined;
  if (auth.role === ROLES.STUDENT && status === "SUBMITTED") {
    const submitWindow = canSubmitAssignmentAt({
      dueDate: existing.assignment.dueDate,
      allowLateSubmission: existing.assignment.allowLateSubmission,
      lateUntil: existing.assignment.lateUntil,
    });
    if (!submitWindow.allowed) {
      return jsonError("CONFLICT", submitWindow.reason ?? "Submission ditolak", 409);
    }
  }
  const submittedAt =
    body.submittedAt !== undefined
      ? body.submittedAt
        ? new Date(String(body.submittedAt))
        : null
      : status === "SUBMITTED"
        ? new Date()
        : undefined;
  const isStudentActor = auth.role === ROLES.STUDENT;
  const reason =
    typeof body.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim()
      : null;

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.assignmentSubmission.update({
      where: { id },
      data: {
        status,
        grade: isStudentActor ? undefined : body.grade,
        feedback: isStudentActor ? undefined : body.feedback,
        response: body.response,
        submittedAt,
      },
    });

    const shouldLogSubmissionLifecycle =
      existing.status !== updated.status ||
      (existing.submittedAt?.getTime() ?? null) !==
        (updated.submittedAt?.getTime() ?? null);
    if (shouldLogSubmissionLifecycle) {
      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action: "SUBMISSION_STATUS_CHANGED",
          entityType: "AssignmentSubmission",
          entityId: updated.id,
          beforeData: {
            status: existing.status,
            submittedAt: existing.submittedAt,
          },
          afterData: {
            status: updated.status,
            submittedAt: updated.submittedAt,
          },
          metadata: {
            assignmentId: updated.assignmentId,
            studentId: updated.studentId,
          },
        },
      });
    }

    const shouldLogGradeAudit =
      !isStudentActor &&
      (existing.grade !== updated.grade ||
        (existing.feedback ?? null) !== (updated.feedback ?? null) ||
        existing.status !== updated.status);

    if (shouldLogGradeAudit) {
      const action =
        existing.status !== updated.status && updated.status === "GRADED"
          ? "GRADE_PUBLISHED"
          : "GRADE_UPDATED";
      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action,
          entityType: "AssignmentSubmission",
          entityId: updated.id,
          beforeData: {
            status: existing.status,
            grade: existing.grade,
            feedback: existing.feedback,
          },
          afterData: {
            status: updated.status,
            grade: updated.grade,
            feedback: updated.feedback,
          },
          metadata: {
            assignmentId: updated.assignmentId,
            studentId: updated.studentId,
          },
          reason,
        },
      });
    }

    return updated;
  });

  return jsonOk(row);
}

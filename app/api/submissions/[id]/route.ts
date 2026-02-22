import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
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
  const submittedAt =
    body.submittedAt !== undefined
      ? body.submittedAt
        ? new Date(String(body.submittedAt))
        : null
      : status === "SUBMITTED"
        ? new Date()
        : undefined;
  const isStudentActor = auth.role === ROLES.STUDENT;

  const row = await prisma.assignmentSubmission.update({
    where: { id },
    data: {
      status,
      grade: isStudentActor ? undefined : body.grade,
      feedback: isStudentActor ? undefined : body.feedback,
      response: body.response,
      submittedAt,
    },
  });

  return jsonOk(row);
}

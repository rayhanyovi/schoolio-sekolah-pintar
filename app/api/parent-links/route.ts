import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  if (!body?.parentId || !body?.studentId) {
    return jsonError("VALIDATION_ERROR", "parentId and studentId are required");
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const [parent, student] = await Promise.all([
        tx.user.findFirst({
          where: { id: body.parentId, role: ROLES.PARENT, schoolId },
          select: { id: true },
        }),
        tx.user.findFirst({
          where: { id: body.studentId, role: ROLES.STUDENT, schoolId },
          select: { id: true },
        }),
      ]);
      if (!parent || !student) {
        throw new Error("NOT_FOUND_MEMBER");
      }

      const created = await tx.parentStudent.create({
        data: {
          parentId: body.parentId,
          studentId: body.studentId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action: "PARENT_STUDENT_LINK_CREATED",
          entityType: "ParentStudent",
          entityId: `${body.parentId}:${body.studentId}`,
          beforeData: null,
          afterData: {
            parentId: body.parentId,
            studentId: body.studentId,
          },
        },
      });
      return created;
    });

    return jsonOk(row, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND_MEMBER") {
      return jsonError("NOT_FOUND", "Parent atau siswa tidak ditemukan", 404);
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  if (!body?.parentId || !body?.studentId) {
    return jsonError("VALIDATION_ERROR", "parentId and studentId are required");
  }

  const [parent, student] = await Promise.all([
    prisma.user.findFirst({
      where: { id: body.parentId, role: ROLES.PARENT, schoolId },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: body.studentId, role: ROLES.STUDENT, schoolId },
      select: { id: true },
    }),
  ]);
  if (!parent || !student) {
    return jsonError("NOT_FOUND", "Parent-student link not found", 404);
  }

  const removed = await prisma.$transaction(async (tx) => {
    const existing = await tx.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: body.parentId,
          studentId: body.studentId,
        },
      },
    });
    if (!existing) return null;

    await tx.parentStudent.delete({
      where: {
        parentId_studentId: {
          parentId: body.parentId,
          studentId: body.studentId,
        },
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action: "PARENT_STUDENT_LINK_REMOVED",
        entityType: "ParentStudent",
        entityId: `${body.parentId}:${body.studentId}`,
        beforeData: {
          parentId: body.parentId,
          studentId: body.studentId,
        },
        afterData: null,
      },
    });
    return existing;
  });
  if (!removed) {
    return jsonError("NOT_FOUND", "Parent-student link not found", 404);
  }

  return jsonOk({ parentId: body.parentId, studentId: body.studentId });
}

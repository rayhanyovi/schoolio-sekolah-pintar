import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.parentId || !body?.studentId) {
    return jsonError("VALIDATION_ERROR", "parentId and studentId are required");
  }

  const row = await prisma.$transaction(async (tx) => {
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
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.parentId || !body?.studentId) {
    return jsonError("VALIDATION_ERROR", "parentId and studentId are required");
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

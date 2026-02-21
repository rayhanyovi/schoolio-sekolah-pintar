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

  const row = await prisma.parentStudent.create({
    data: {
      parentId: body.parentId,
      studentId: body.studentId,
    },
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

  await prisma.parentStudent.delete({
    where: {
      parentId_studentId: {
        parentId: body.parentId,
        studentId: body.studentId,
      },
    },
  });

  return jsonOk({ parentId: body.parentId, studentId: body.studentId });
}

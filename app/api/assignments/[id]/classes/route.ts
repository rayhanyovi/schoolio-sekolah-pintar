import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: { teacherId: true, subjectId: true },
  });
  if (!assignment) return jsonError("NOT_FOUND", "Assignment not found", 404);
  if (auth.role === ROLES.TEACHER && assignment.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah kelas tugas ini", 403);
  }

  const body = await request.json();
  const classIds: string[] = body?.classIds ?? [];
  if (!Array.isArray(classIds)) {
    return jsonError("VALIDATION_ERROR", "classIds array is required");
  }
  if (auth.role === ROLES.TEACHER && classIds.length) {
    const allowedRows = await prisma.subjectClass.findMany({
      where: {
        subjectId: assignment.subjectId,
        classId: { in: classIds },
      },
      select: { classId: true },
    });
    if (allowedRows.length !== classIds.length) {
      return jsonError(
        "FORBIDDEN",
        "Kelas yang dipilih tidak sesuai relasi mapel",
        403
      );
    }
  }

  await prisma.assignmentClass.deleteMany({ where: { assignmentId: id } });
  if (classIds.length) {
    await prisma.assignmentClass.createMany({
      data: classIds.map((classId) => ({
        assignmentId: id,
        classId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id, classIds });
}

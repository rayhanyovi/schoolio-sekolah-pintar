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
    select: { teacherId: true },
  });
  if (!assignment) return jsonError("NOT_FOUND", "Assignment not found", 404);
  if (auth.role === ROLES.TEACHER && assignment.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah soal tugas ini", 403);
  }

  const body = await request.json();
  const questionIds: string[] | undefined = body?.questionIds;
  const questionPackageId: string | null = body?.questionPackageId ?? null;

  if (questionIds && !Array.isArray(questionIds)) {
    return jsonError("VALIDATION_ERROR", "questionIds must be an array");
  }

  await prisma.assignment.update({
    where: { id },
    data: {
      questionPackageId,
    },
  });

  if (questionIds) {
    await prisma.assignmentQuestion.deleteMany({ where: { assignmentId: id } });
    if (questionIds.length) {
      await prisma.assignmentQuestion.createMany({
        data: questionIds.map((questionId, index) => ({
          assignmentId: id,
          questionId,
          position: index + 1,
        })),
        skipDuplicates: true,
      });
    }
  } else if (questionPackageId) {
    const items = await prisma.questionPackageItem.findMany({
      where: { packageId: questionPackageId },
      orderBy: { position: "asc" },
    });
    await prisma.assignmentQuestion.deleteMany({ where: { assignmentId: id } });
    if (items.length) {
      await prisma.assignmentQuestion.createMany({
        data: items.map((item, index) => ({
          assignmentId: id,
          questionId: item.questionId,
          position: item.position ?? index + 1,
        })),
        skipDuplicates: true,
      });
    }
  }

  return jsonOk({ id, questionPackageId, questionIds: questionIds ?? [] });
}

import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const body = await request.json();
  const questionIds: string[] | undefined = body?.questionIds;
  const questionPackageId: string | null = body?.questionPackageId ?? null;

  if (questionIds && !Array.isArray(questionIds)) {
    return jsonError("VALIDATION_ERROR", "questionIds must be an array");
  }

  await prisma.assignment.update({
    where: { id: params.id },
    data: {
      questionPackageId,
    },
  });

  if (questionIds) {
    await prisma.assignmentQuestion.deleteMany({ where: { assignmentId: params.id } });
    if (questionIds.length) {
      await prisma.assignmentQuestion.createMany({
        data: questionIds.map((questionId, index) => ({
          assignmentId: params.id,
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
    await prisma.assignmentQuestion.deleteMany({ where: { assignmentId: params.id } });
    if (items.length) {
      await prisma.assignmentQuestion.createMany({
        data: items.map((item, index) => ({
          assignmentId: params.id,
          questionId: item.questionId,
          position: item.position ?? index + 1,
        })),
        skipDuplicates: true,
      });
    }
  }

  return jsonOk({ id: params.id, questionPackageId, questionIds: questionIds ?? [] });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function PUT(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const questionIds: string[] = body?.questionIds ?? [];
  if (!Array.isArray(questionIds)) {
    return jsonError("VALIDATION_ERROR", "questionIds array is required");
  }

  await prisma.questionPackageItem.deleteMany({ where: { packageId: params.id } });
  if (questionIds.length) {
    await prisma.questionPackageItem.createMany({
      data: questionIds.map((questionId, index) => ({
        packageId: params.id,
        questionId,
        position: index + 1,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, questionIds });
}

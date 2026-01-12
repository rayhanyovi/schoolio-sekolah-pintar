import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
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

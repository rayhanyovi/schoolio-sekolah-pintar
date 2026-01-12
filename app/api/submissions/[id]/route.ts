import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const status = body.status;
  const submittedAt =
    body.submittedAt !== undefined
      ? body.submittedAt
        ? new Date(body.submittedAt)
        : null
      : status === "SUBMITTED"
        ? new Date()
        : undefined;

  const row = await prisma.assignmentSubmission.update({
    where: { id: params.id },
    data: {
      status,
      grade: body.grade,
      feedback: body.feedback,
      response: body.response,
      submittedAt,
    },
  });

  return jsonOk(row);
}

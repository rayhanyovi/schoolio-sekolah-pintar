import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.forumReply.update({
    where: { id: params.id },
    data: {
      content: body.content,
      isAcceptedAnswer: body.isAcceptedAnswer,
      upvotes: body.upvotes,
    },
  });
  return jsonOk(row);
}

import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const delta = Number(body?.delta ?? 1);

  const row = await prisma.forumReply.update({
    where: { id: params.id },
    data: { upvotes: { increment: Number.isFinite(delta) ? delta : 1 } },
  });

  return jsonOk(row);
}

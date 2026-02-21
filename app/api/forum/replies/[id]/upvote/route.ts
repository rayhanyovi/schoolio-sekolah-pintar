import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

  const body = await request.json().catch(() => ({}));
  const delta = Number(body?.delta ?? 1);

  const row = await prisma.forumReply.update({
    where: { id: params.id },
    data: { upvotes: { increment: Number.isFinite(delta) ? delta : 1 } },
  });

  return jsonOk(row);
}

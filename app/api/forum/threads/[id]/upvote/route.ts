import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseJsonRecordBodyAllowEmpty, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

  const parsedRequestBody = await parseJsonRecordBodyAllowEmpty(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const delta = Number(body?.delta ?? 1);

  const row = await prisma.forumThread.update({
    where: { id: params.id },
    data: { upvotes: { increment: Number.isFinite(delta) ? delta : 1 } },
  });

  return jsonOk(row);
}

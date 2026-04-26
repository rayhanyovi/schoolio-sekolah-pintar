import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseJsonRecordBodyAllowEmpty, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const routeParams = await params;
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  if (auth.role === ROLES.PARENT) {
    return jsonError("FORBIDDEN", "Parent tidak memiliki akses ke forum", 403);
  }

  const parsedRequestBody = await parseJsonRecordBodyAllowEmpty(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const existing = await prisma.forumThread.findUnique({
    where: { id: routeParams.id },
    select: { isPinned: true },
  });
  const next =
    typeof body?.value === "boolean"
      ? body.value
      : !(existing?.isPinned ?? false);

  const row = await prisma.forumThread.update({
    where: { id: routeParams.id },
    data: { isPinned: next },
  });

  return jsonOk(row);
}

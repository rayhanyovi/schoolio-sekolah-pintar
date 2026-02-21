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
  const existing = await prisma.forumThread.findUnique({
    where: { id: params.id },
    select: { status: true },
  });

  const shouldLock =
    typeof body?.value === "boolean"
      ? body.value
      : existing?.status !== "LOCKED";

  const row = await prisma.forumThread.update({
    where: { id: params.id },
    data: { status: shouldLock ? "LOCKED" : "OPEN" },
  });

  return jsonOk(row);
}

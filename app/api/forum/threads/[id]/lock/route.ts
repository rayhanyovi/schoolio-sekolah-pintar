import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
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

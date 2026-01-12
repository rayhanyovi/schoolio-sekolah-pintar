import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const existing = await prisma.forumThread.findUnique({
    where: { id: params.id },
    select: { isPinned: true },
  });
  const next =
    typeof body?.value === "boolean"
      ? body.value
      : !(existing?.isPinned ?? false);

  const row = await prisma.forumThread.update({
    where: { id: params.id },
    data: { isPinned: next },
  });

  return jsonOk(row);
}

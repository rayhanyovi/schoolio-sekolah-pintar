import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string; attachmentId: string } };

export async function DELETE(_: Request, { params }: Params) {
  await prisma.materialAttachment.delete({ where: { id: params.attachmentId } });
  return jsonOk({ id: params.attachmentId, materialId: params.id });
}

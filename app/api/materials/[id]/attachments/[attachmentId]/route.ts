import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string; attachmentId: string } };

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const attachment = await prisma.materialAttachment.findUnique({
    where: { id: params.attachmentId },
    include: {
      material: {
        select: { teacherId: true },
      },
    },
  });
  if (!attachment) {
    return jsonError("NOT_FOUND", "Attachment not found", 404);
  }
  if (attachment.materialId !== params.id) {
    return jsonError("NOT_FOUND", "Attachment not found", 404);
  }
  if (
    auth.role === ROLES.TEACHER &&
    attachment.material.teacherId !== auth.userId
  ) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah materi ini", 403);
  }

  await prisma.materialAttachment.delete({ where: { id: params.attachmentId } });
  return jsonOk({ id: params.attachmentId, materialId: params.id });
}

import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const routeParams = await params;
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const attachment = await prisma.materialAttachment.findUnique({
    where: { id: routeParams.attachmentId },
    include: {
      material: {
        select: { teacherId: true },
      },
    },
  });
  if (!attachment) {
    return jsonError("NOT_FOUND", "Attachment not found", 404);
  }
  if (attachment.materialId !== routeParams.id) {
    return jsonError("NOT_FOUND", "Attachment not found", 404);
  }
  if (
    auth.role === ROLES.TEACHER &&
    attachment.material.teacherId !== auth.userId
  ) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah materi ini", 403);
  }

  await prisma.materialAttachment.delete({ where: { id: routeParams.attachmentId } });
  return jsonOk({ id: routeParams.attachmentId, materialId: routeParams.id });
}

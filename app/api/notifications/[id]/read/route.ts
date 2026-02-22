import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const { id } = await params;
  const existing = await prisma.notification.findUnique({
    where: { id },
    select: { id: true, recipientId: true, isRead: true },
  });
  if (!existing) {
    return jsonError("NOT_FOUND", "Notification not found", 404);
  }
  if (existing.recipientId !== auth.userId) {
    return jsonError("FORBIDDEN", "Notification access out of scope", 403);
  }

  const row = existing.isRead
    ? await prisma.notification.findUnique({ where: { id } })
    : await prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });

  return jsonOk({
    id: row?.id ?? id,
    isRead: true,
    readAt: row?.readAt ?? new Date(),
  });
}

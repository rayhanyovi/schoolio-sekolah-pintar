import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]);
  if (roleError) return roleError;

  const body = await request.json().catch(() => ({}));
  const existing = await prisma.note.findUnique({
    where: { id: params.id },
    select: { isPinned: true, authorId: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Note not found", 404);
  if (auth.role !== ROLES.ADMIN && existing.authorId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa pin catatan ini", 403);
  }
  const next =
    typeof body?.value === "boolean"
      ? body.value
      : !(existing?.isPinned ?? false);

  const row = await prisma.note.update({
    where: { id: params.id },
    data: { isPinned: next },
  });

  return jsonOk(row);
}

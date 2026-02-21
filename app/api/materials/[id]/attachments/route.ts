import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const material = await prisma.material.findUnique({
    where: { id: params.id },
    select: { teacherId: true },
  });
  if (!material) return jsonError("NOT_FOUND", "Material not found", 404);
  if (auth.role === ROLES.TEACHER && material.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah materi ini", 403);
  }

  const body = await request.json();
  if (!body?.fileName || !body?.fileType) {
    return jsonError("VALIDATION_ERROR", "fileName and fileType are required");
  }

  const row = await prisma.materialAttachment.create({
    data: {
      materialId: params.id,
      fileName: body.fileName,
      fileType: body.fileType,
      sizeLabel: body.sizeLabel ?? null,
      url: body.url ?? null,
      storageKey: body.storageKey ?? null,
    },
  });

  return jsonOk(row, { status: 201 });
}

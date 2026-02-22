import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, parseJsonRecordBody, requireAuth, requireRole } from "@/lib/api";
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

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const uploadIntentId =
    typeof body?.uploadIntentId === "string"
      ? body.uploadIntentId.trim()
      : "";
  if (!uploadIntentId) {
    return jsonError(
      "VALIDATION_ERROR",
      "uploadIntentId wajib diisi (gunakan flow upload intent + confirm)",
      400
    );
  }

  const intent = await prisma.uploadIntent.findUnique({
    where: { id: uploadIntentId },
    include: {
      attachment: true,
    },
  });
  if (!intent || intent.materialId !== params.id) {
    return jsonError("NOT_FOUND", "Upload intent tidak ditemukan", 404);
  }
  if (intent.status !== "CONFIRMED") {
    return jsonError(
      "CONFLICT",
      "Upload intent belum dikonfirmasi",
      409
    );
  }
  if (!intent.attachment) {
    return jsonError(
      "CONFLICT",
      "Attachment final belum tersedia pada upload intent ini",
      409
    );
  }

  return jsonOk(intent.attachment, { status: 201 });
}

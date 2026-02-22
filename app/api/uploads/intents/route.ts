import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  buildUploadStorageKey,
  createUploadToken,
  getMaxUploadSizeBytes,
  isAllowedUploadMimeType,
  sanitizeFileName,
} from "@/lib/upload-intent";

const CHECKSUM_SHA256_REGEX = /^[a-fA-F0-9]{64}$/;
const DEFAULT_UPLOAD_INTENT_TTL_MINUTES = 15;

const getUploadIntentTtlMinutes = () => {
  const parsed = Number.parseInt(
    process.env.UPLOAD_INTENT_TTL_MINUTES ?? "",
    10
  );
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_UPLOAD_INTENT_TTL_MINUTES;
  }
  return parsed;
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  const materialId =
    typeof body?.materialId === "string" ? body.materialId.trim() : "";
  const fileName =
    typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const fileType =
    typeof body?.fileType === "string" ? body.fileType.trim() : "";
  const checksumSha256 =
    typeof body?.checksumSha256 === "string"
      ? body.checksumSha256.trim().toLowerCase()
      : "";
  const sizeBytes = Number(body?.sizeBytes);

  if (!materialId || !fileName || !fileType) {
    return jsonError(
      "VALIDATION_ERROR",
      "materialId, fileName, fileType wajib diisi",
      400
    );
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return jsonError("VALIDATION_ERROR", "sizeBytes harus integer > 0", 400);
  }
  if (!CHECKSUM_SHA256_REGEX.test(checksumSha256)) {
    return jsonError(
      "VALIDATION_ERROR",
      "checksumSha256 harus hash SHA-256 hex 64 karakter",
      400
    );
  }
  if (!isAllowedUploadMimeType(fileType)) {
    return jsonError(
      "VALIDATION_ERROR",
      `fileType ${fileType} tidak diizinkan`,
      400
    );
  }
  const maxUploadSizeBytes = getMaxUploadSizeBytes();
  if (sizeBytes > maxUploadSizeBytes) {
    return jsonError(
      "VALIDATION_ERROR",
      `sizeBytes melebihi batas ${maxUploadSizeBytes} byte`,
      400
    );
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      teacherId: true,
    },
  });
  if (!material) {
    return jsonError("NOT_FOUND", "Material tidak ditemukan", 404);
  }
  if (auth.role === ROLES.TEACHER && material.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa upload ke material ini", 403);
  }

  const intentId = randomUUID();
  const storageKey = buildUploadStorageKey(
    material.id,
    intentId,
    sanitizeFileName(fileName)
  );
  const { token, tokenHash } = createUploadToken();
  const expiresAt = new Date(
    Date.now() + getUploadIntentTtlMinutes() * 60 * 1000
  );

  const intent = await prisma.uploadIntent.create({
    data: {
      id: intentId,
      materialId: material.id,
      uploadedById: auth.userId,
      fileName: sanitizeFileName(fileName),
      fileType,
      sizeBytes,
      checksumSha256,
      storageKey,
      uploadTokenHash: tokenHash,
      expiresAt,
    },
    select: {
      id: true,
      materialId: true,
      fileName: true,
      fileType: true,
      sizeBytes: true,
      checksumSha256: true,
      storageKey: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return jsonOk(
    {
      ...intent,
      method: "PUT",
      uploadUrl: `/api/uploads/intents/${intent.id}/content?token=${token}`,
    },
    { status: 201 }
  );
}

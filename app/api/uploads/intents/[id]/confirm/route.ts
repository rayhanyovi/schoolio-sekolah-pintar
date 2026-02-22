import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { toFileSizeLabel } from "@/lib/upload-intent";
import { queueUploadScan } from "@/lib/upload-scan";

type Params = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const current = await prisma.uploadIntent.findUnique({
    where: { id: params.id },
    include: {
      material: {
        select: {
          id: true,
          teacherId: true,
        },
      },
      attachment: true,
    },
  });
  if (!current) {
    return jsonError("NOT_FOUND", "Upload intent tidak ditemukan", 404);
  }
  if (auth.role === ROLES.TEACHER && current.material.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa konfirmasi upload ini", 403);
  }
  if (current.status === "EXPIRED" || current.expiresAt.getTime() <= Date.now()) {
    return jsonError("CONFLICT", "Upload intent sudah kedaluwarsa", 409);
  }
  if (current.status === "PENDING") {
    return jsonError("CONFLICT", "File belum di-upload", 409);
  }
  if (
    current.uploadedSizeBytes !== current.sizeBytes ||
    current.uploadedChecksumSha256 !== current.checksumSha256
  ) {
    return jsonError(
      "CONFLICT",
      "Integritas file gagal. Ukuran/checksum tidak sesuai upload intent.",
      409
    );
  }
  if (current.status === "CONFIRMED" && current.attachment) {
    return jsonOk({
      id: current.id,
      status: current.status,
      attachment: current.attachment,
      scanStatus: current.scanStatus,
      scanResult: current.scanResult,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const attachment = await tx.materialAttachment.upsert({
      where: { uploadIntentId: current.id },
      update: {
        fileName: current.fileName,
        fileType: current.fileType,
        sizeLabel: toFileSizeLabel(current.sizeBytes),
        storageKey: current.storageKey,
        url: null,
        checksumSha256: current.uploadedChecksumSha256 ?? current.checksumSha256,
        etag: current.uploadedChecksumSha256 ?? current.checksumSha256,
        scanStatus: current.scanStatus,
      },
      create: {
        materialId: current.materialId,
        fileName: current.fileName,
        fileType: current.fileType,
        sizeLabel: toFileSizeLabel(current.sizeBytes),
        storageKey: current.storageKey,
        url: null,
        checksumSha256: current.uploadedChecksumSha256 ?? current.checksumSha256,
        etag: current.uploadedChecksumSha256 ?? current.checksumSha256,
        scanStatus: current.scanStatus,
        uploadIntentId: current.id,
      },
    });

    const scanJob = await queueUploadScan(tx, {
      intentId: current.id,
      provider: "NOOP",
    });

    await tx.materialAttachment.update({
      where: { id: attachment.id },
      data: {
        scanStatus: scanJob.status,
      },
    });

    const confirmedIntent = await tx.uploadIntent.update({
      where: { id: current.id },
      data: {
        status: "CONFIRMED",
        confirmedById: auth.userId,
        confirmedAt: new Date(),
        scanStatus: scanJob.status,
        scanResult: scanJob.result ?? null,
      },
      select: {
        id: true,
        status: true,
        scanStatus: true,
        scanResult: true,
      },
    });

    return {
      intent: confirmedIntent,
      attachment: {
        ...attachment,
        scanStatus: scanJob.status,
      },
    };
  });

  return jsonOk({
    id: result.intent.id,
    status: result.intent.status,
    scanStatus: result.intent.scanStatus,
    scanResult: result.intent.scanResult,
    attachment: result.attachment,
  });
}

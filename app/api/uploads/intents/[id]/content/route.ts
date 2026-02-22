import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { putObject, computeSha256 } from "@/lib/object-storage";
import { prisma } from "@/lib/prisma";
import { hashUploadToken } from "@/lib/upload-intent";

type Params = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: Params) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  if (!token) {
    return jsonError("UNAUTHORIZED", "Token upload tidak ditemukan", 401);
  }

  const intent = await prisma.uploadIntent.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      fileType: true,
      sizeBytes: true,
      checksumSha256: true,
      storageKey: true,
      uploadTokenHash: true,
      expiresAt: true,
      status: true,
    },
  });
  if (!intent) {
    return jsonError("NOT_FOUND", "Upload intent tidak ditemukan", 404);
  }
  if (intent.status === "CONFIRMED") {
    return jsonError("CONFLICT", "Upload intent sudah dikonfirmasi", 409);
  }
  if (intent.status === "EXPIRED" || intent.expiresAt.getTime() <= Date.now()) {
    if (intent.status !== "EXPIRED") {
      await prisma.uploadIntent.update({
        where: { id: intent.id },
        data: { status: "EXPIRED" },
      });
    }
    return jsonError("CONFLICT", "Upload intent sudah kedaluwarsa", 409);
  }

  const tokenHash = hashUploadToken(token);
  if (tokenHash !== intent.uploadTokenHash) {
    return jsonError("UNAUTHORIZED", "Token upload tidak valid", 401);
  }

  const contentType = request.headers.get("content-type");
  if (contentType && contentType !== intent.fileType) {
    return jsonError(
      "VALIDATION_ERROR",
      "content-type tidak sesuai dengan upload intent",
      400
    );
  }

  const payload = Buffer.from(await request.arrayBuffer());
  if (payload.length !== intent.sizeBytes) {
    return jsonError(
      "VALIDATION_ERROR",
      "Ukuran file tidak sesuai dengan upload intent",
      400
    );
  }
  const checksumSha256 = computeSha256(payload);
  if (checksumSha256 !== intent.checksumSha256) {
    return jsonError(
      "CONFLICT",
      "Checksum file tidak sesuai dengan upload intent",
      409
    );
  }

  await putObject(intent.storageKey, payload);
  await prisma.uploadIntent.update({
    where: { id: intent.id },
    data: {
      status: "UPLOADED",
      uploadedAt: new Date(),
      uploadedSizeBytes: payload.length,
      uploadedChecksumSha256: checksumSha256,
      scanStatus: "PENDING",
      scanResult: null,
    },
  });

  return jsonOk({
    id: intent.id,
    status: "UPLOADED",
    sizeBytes: payload.length,
    checksumSha256,
    etag: checksumSha256,
  });
}

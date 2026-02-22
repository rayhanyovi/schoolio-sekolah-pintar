import { createHash, randomBytes } from "node:crypto";

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

export const getMaxUploadSizeBytes = () => {
  const parsed = Number.parseInt(
    process.env.MAX_UPLOAD_SIZE_BYTES ?? "",
    10
  );
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_UPLOAD_SIZE_BYTES;
  }
  return parsed;
};

export const isAllowedUploadMimeType = (value: string) =>
  ALLOWED_UPLOAD_MIME_TYPES.includes(
    value as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number]
  );

export const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "file";

export const toFileSizeLabel = (sizeBytes: number) => {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const createUploadToken = () => {
  const token = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

export const hashUploadToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const buildUploadStorageKey = (
  materialId: string,
  intentId: string,
  fileName: string
) => `materials/${materialId}/${intentId}/${sanitizeFileName(fileName)}`;

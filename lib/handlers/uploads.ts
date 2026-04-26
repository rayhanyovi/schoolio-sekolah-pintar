import { apiPost } from "@/lib/api-client";
import { CSRF_HEADER_NAME, getCsrfTokenFromCookie } from "@/lib/csrf";
import { uploadConfirmResultSchema, uploadIntentSchema } from "@/lib/schemas";

export type CreateUploadIntentPayload = {
  materialId: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  checksumSha256: string;
};

export const createUploadIntent = async (payload: CreateUploadIntentPayload) =>
  uploadIntentSchema.parse(await apiPost("/api/uploads/intents", payload));

export const uploadContentWithSignedUrl = async (input: {
  uploadUrl: string;
  fileType: string;
  data: Blob | ArrayBuffer | Uint8Array;
}) => {
  const body: BodyInit =
    input.data instanceof Blob
      ? input.data
      : new Blob([input.data as BlobPart], { type: input.fileType });
  const headers = new Headers({ "content-type": input.fileType });
  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  const response = await fetch(input.uploadUrl, {
    method: "PUT",
    headers,
    body,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? "Upload ke signed URL gagal"
    );
  }
  return payload.data as {
    id: string;
    status: string;
    sizeBytes: number;
    checksumSha256: string;
    etag: string;
  };
};

export const confirmUploadIntent = async (intentId: string) =>
  uploadConfirmResultSchema.parse(
    await apiPost(`/api/uploads/intents/${intentId}/confirm`, {})
  );

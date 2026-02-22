import { apiPost } from "@/lib/api-client";
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
  const body =
    input.data instanceof Uint8Array
      ? input.data
      : input.data instanceof Blob
      ? input.data
      : new Uint8Array(input.data);

  const response = await fetch(input.uploadUrl, {
    method: "PUT",
    headers: { "content-type": input.fileType },
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

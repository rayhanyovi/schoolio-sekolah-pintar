import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type MaterialPayload = Record<string, unknown>;

export type ListMaterialsParams = {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  q?: string;
};

export const listMaterials = (params?: ListMaterialsParams) =>
  apiGet<MaterialPayload[]>("/api/materials", params);

export const getMaterial = (id: string) =>
  apiGet<MaterialPayload>(`/api/materials/${id}`);

export const createMaterial = (payload: MaterialPayload) =>
  apiPost<MaterialPayload>("/api/materials", payload);

export const updateMaterial = (id: string, payload: MaterialPayload) =>
  apiPatch<MaterialPayload>(`/api/materials/${id}`, payload);

export const deleteMaterial = (id: string) =>
  apiDelete<{ id: string }>(`/api/materials/${id}`);

export const addMaterialAttachment = (id: string, payload: MaterialPayload) =>
  apiPost<MaterialPayload>(`/api/materials/${id}/attachments`, payload);

export const deleteMaterialAttachment = (
  materialId: string,
  attachmentId: string
) =>
  apiDelete<{ id: string }>(
    `/api/materials/${materialId}/attachments/${attachmentId}`
  );

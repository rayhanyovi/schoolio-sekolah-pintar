import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { materialListSchema, materialSchema } from "@/lib/schemas";

export type MaterialPayload = Record<string, unknown>;

export type ListMaterialsParams = {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  q?: string;
};

export const listMaterials = async (params?: ListMaterialsParams) =>
  materialListSchema.parse(await apiGet("/api/materials", params));

const normalizeMaterial = (value: Record<string, any>) => {
  if (value && typeof value === "object" && value.subject) {
    return {
      id: value.id,
      title: value.title,
      description: value.description ?? "",
      subject: value.subject?.name ?? "",
      subjectId: value.subjectId,
      className: value.class?.name ?? "",
      classId: value.classId ?? undefined,
      teacher: value.teacher?.name ?? "",
      teacherId: value.teacherId,
      createdAt: value.createdAt,
      attachments: Array.isArray(value.attachments)
        ? value.attachments.map((file: any) => ({
            id: file.id,
            name: file.fileName,
            size: file.sizeLabel ?? "",
            type: file.fileType,
            url: file.url ?? undefined,
            storageKey: file.storageKey ?? undefined,
          }))
        : [],
    };
  }
  return value;
};

export const getMaterial = async (id: string) => {
  const data = await apiGet<Record<string, unknown>>(`/api/materials/${id}`);
  return materialSchema.parse(normalizeMaterial(data as Record<string, any>));
};

export const createMaterial = async (payload: MaterialPayload) => {
  const created = await apiPost<MaterialPayload>("/api/materials", payload);
  if (created && typeof created === "object" && "id" in created) {
    return getMaterial(String(created.id));
  }
  return materialSchema.parse(created);
};

export const updateMaterial = async (id: string, payload: MaterialPayload) => {
  const updated = await apiPatch<MaterialPayload>(
    `/api/materials/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return getMaterial(String(updated.id));
  }
  return materialSchema.parse(updated);
};

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

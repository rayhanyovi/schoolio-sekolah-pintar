import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { materialListSchema, materialSchema } from "@/lib/schemas";

export type MaterialPayload = Record<string, unknown>;
type UnknownRecord = Record<string, unknown>;

export type ListMaterialsParams = {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  q?: string;
};

export const listMaterials = async (params?: ListMaterialsParams) =>
  materialListSchema.parse(await apiGet("/api/materials", params));

const normalizeMaterial = (value: UnknownRecord) => {
  const subjectValue =
    value.subject && typeof value.subject === "object"
      ? (value.subject as UnknownRecord)
      : null;
  const classValue =
    value.class && typeof value.class === "object"
      ? (value.class as UnknownRecord)
      : null;
  const teacherValue =
    value.teacher && typeof value.teacher === "object"
      ? (value.teacher as UnknownRecord)
      : null;

  if (value && typeof value === "object" && value.subject) {
    return {
      id: value.id,
      title: value.title,
      description: value.description ?? "",
      subject:
        (typeof subjectValue?.name === "string" ? subjectValue.name : "") ?? "",
      subjectId: value.subjectId,
      className: (typeof classValue?.name === "string" ? classValue.name : "") ?? "",
      classId: value.classId ?? undefined,
      teacher:
        (typeof teacherValue?.name === "string" ? teacherValue.name : "") ?? "",
      teacherId: value.teacherId,
      createdAt: value.createdAt,
      attachments: Array.isArray(value.attachments)
        ? value.attachments.map((file) => {
            const fileValue =
              file && typeof file === "object"
                ? (file as UnknownRecord)
                : ({} as UnknownRecord);
            return {
              id: fileValue.id,
              name: fileValue.fileName,
              size: fileValue.sizeLabel ?? "",
              type: fileValue.fileType,
              url: fileValue.url ?? undefined,
              storageKey: fileValue.storageKey ?? undefined,
            };
          })
        : [],
    };
  }
  return value;
};

export const getMaterial = async (id: string) => {
  const data = await apiGet<Record<string, unknown>>(`/api/materials/${id}`);
  return materialSchema.parse(normalizeMaterial(data as UnknownRecord));
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

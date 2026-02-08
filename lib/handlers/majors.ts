import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import { majorListSchema, majorSchema, userListSchema } from "@/lib/schemas";

export type MajorPayload = {
  code: string;
  name?: string | null;
  description?: string | null;
};

export const listMajors = async () =>
  majorListSchema.parse(await apiGet("/api/majors"));

export const getMajor = async (id: string) =>
  majorSchema.parse(await apiGet(`/api/majors/${id}`));

export const createMajor = async (payload: MajorPayload) =>
  majorSchema.parse(await apiPost("/api/majors", payload));

export const updateMajor = async (id: string, payload: MajorPayload) =>
  majorSchema.parse(await apiPatch(`/api/majors/${id}`, payload));

export const deleteMajor = (id: string) =>
  apiDelete<{ id: string }>(`/api/majors/${id}`);

export const listMajorTeachers = async (id: string) =>
  userListSchema.parse(await apiGet(`/api/majors/${id}/teachers`));

export const setMajorTeachers = async (id: string, teacherIds: string[]) =>
  apiPut<{ id: string; teacherIds: string[] }>(
    `/api/majors/${id}/teachers`,
    { teacherIds }
  );

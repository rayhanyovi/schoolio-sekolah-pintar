import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import { subjectListSchema, subjectSchema } from "@/lib/schemas";

export type ListSubjectsParams = {
  category?: string;
  q?: string;
};

export const listSubjects = async (params?: ListSubjectsParams) =>
  subjectListSchema.parse(await apiGet("/api/subjects", params));

export const getSubject = async (id: string) =>
  subjectSchema.parse(await apiGet(`/api/subjects/${id}`));

export const createSubject = async (payload: Record<string, unknown>) =>
  subjectSchema.parse(await apiPost("/api/subjects", payload));

export const updateSubject = async (
  id: string,
  payload: Record<string, unknown>
) => subjectSchema.parse(await apiPatch(`/api/subjects/${id}`, payload));

export const deleteSubject = (id: string) =>
  apiDelete<{ id: string }>(`/api/subjects/${id}`);

export const setSubjectTeachers = (id: string, teacherIds: string[]) =>
  apiPut<Record<string, unknown>>(`/api/subjects/${id}/teachers`, {
    teacherIds,
  });

export const setSubjectClasses = (id: string, classIds: string[]) =>
  apiPut<Record<string, unknown>>(`/api/subjects/${id}/classes`, { classIds });

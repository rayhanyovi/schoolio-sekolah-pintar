import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import {
  classListSchema,
  classSchema,
  classSubjectListSchema,
  classSubjectSetPayloadSchema,
  classSubjectSetResultSchema,
  classStudentListSchema,
} from "@/lib/schemas";

export type ListClassesParams = {
  grade?: number;
  academicYearId?: string;
  q?: string;
};

export const listClasses = async (params?: ListClassesParams) =>
  classListSchema.parse(await apiGet("/api/classes", params));

export const getClass = async (id: string) =>
  classSchema.parse(await apiGet(`/api/classes/${id}`));

export const createClass = async (payload: Record<string, unknown>) =>
  classSchema.parse(await apiPost("/api/classes", payload));

export const updateClass = async (id: string, payload: Record<string, unknown>) =>
  classSchema.parse(await apiPatch(`/api/classes/${id}`, payload));

export const deleteClass = (id: string) =>
  apiDelete<{ id: string }>(`/api/classes/${id}`);

export const listClassStudents = async (classId: string) =>
  classStudentListSchema.parse(
    await apiGet(`/api/classes/${classId}/students`)
  );

export const listClassSubjects = async (classId: string) =>
  classSubjectListSchema.parse(
    await apiGet(`/api/classes/${classId}/subjects`)
  );

export const setClassSubjects = async (classId: string, subjectIds: string[]) =>
  classSubjectSetResultSchema.parse(
    await apiPut(
      `/api/classes/${classId}/subjects`,
      classSubjectSetPayloadSchema.parse({ subjectIds })
    )
  );

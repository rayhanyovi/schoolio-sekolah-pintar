import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";

export type AssignmentPayload = Record<string, unknown>;

export type ListAssignmentsParams = {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  status?: string;
};

export const listAssignments = (params?: ListAssignmentsParams) =>
  apiGet<AssignmentPayload[]>("/api/assignments", params);

export const getAssignment = (id: string) =>
  apiGet<AssignmentPayload>(`/api/assignments/${id}`);

export const createAssignment = (payload: AssignmentPayload) =>
  apiPost<AssignmentPayload>("/api/assignments", payload);

export const updateAssignment = (id: string, payload: AssignmentPayload) =>
  apiPatch<AssignmentPayload>(`/api/assignments/${id}`, payload);

export const deleteAssignment = (id: string) =>
  apiDelete<{ id: string }>(`/api/assignments/${id}`);

export const setAssignmentClasses = (id: string, classIds: string[]) =>
  apiPut<AssignmentPayload>(`/api/assignments/${id}/classes`, { classIds });

export const setAssignmentQuestions = (
  id: string,
  payload: { questionIds?: string[]; questionPackageId?: string | null }
) => apiPut<AssignmentPayload>(`/api/assignments/${id}/questions`, payload);

export const listAssignmentSubmissions = (id: string) =>
  apiGet<AssignmentPayload[]>(`/api/assignments/${id}/submissions`);

export const createAssignmentSubmission = (
  id: string,
  payload: AssignmentPayload
) => apiPost<AssignmentPayload>(`/api/assignments/${id}/submissions`, payload);

export const updateSubmission = (id: string, payload: AssignmentPayload) =>
  apiPatch<AssignmentPayload>(`/api/submissions/${id}`, payload);

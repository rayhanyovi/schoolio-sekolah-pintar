import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import {
  assignmentListSchema,
  assignmentSchema,
  assignmentSubmissionListSchema,
} from "@/lib/schemas";

export type AssignmentPayload = Record<string, unknown>;

export type ListAssignmentsParams = {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  status?: string;
};

export const listAssignments = async (params?: ListAssignmentsParams) =>
  assignmentListSchema.parse(await apiGet("/api/assignments", params));

export const getAssignment = async (id: string) =>
  assignmentSchema.parse(await apiGet(`/api/assignments/${id}`));

export const createAssignment = async (payload: AssignmentPayload) => {
  const created = await apiPost<AssignmentPayload>("/api/assignments", payload);
  if (created && typeof created === "object" && "id" in created) {
    return getAssignment(String(created.id));
  }
  return assignmentSchema.parse(created);
};

export const updateAssignment = async (id: string, payload: AssignmentPayload) => {
  const updated = await apiPatch<AssignmentPayload>(
    `/api/assignments/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return getAssignment(String(updated.id));
  }
  return assignmentSchema.parse(updated);
};

export const deleteAssignment = (id: string) =>
  apiDelete<{ id: string }>(`/api/assignments/${id}`);

export const setAssignmentClasses = (id: string, classIds: string[]) =>
  apiPut<AssignmentPayload>(`/api/assignments/${id}/classes`, { classIds });

export const setAssignmentQuestions = (
  id: string,
  payload: { questionIds?: string[]; questionPackageId?: string | null }
) => apiPut<AssignmentPayload>(`/api/assignments/${id}/questions`, payload);

export const listAssignmentSubmissions = async (id: string) =>
  assignmentSubmissionListSchema.parse(
    await apiGet(`/api/assignments/${id}/submissions`)
  );

export const createAssignmentSubmission = (
  id: string,
  payload: AssignmentPayload
) => apiPost<AssignmentPayload>(`/api/assignments/${id}/submissions`, payload);

export const updateSubmission = (id: string, payload: AssignmentPayload) =>
  apiPatch<AssignmentPayload>(`/api/submissions/${id}`, payload);

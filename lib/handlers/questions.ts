import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";
import {
  questionListSchema,
  questionPackageListSchema,
  questionPackageSchema,
  questionSchema,
} from "@/lib/schemas";

export type QuestionPayload = Record<string, unknown>;

export type ListQuestionsParams = {
  subject?: string;
  type?: string;
  difficulty?: string;
  q?: string;
};

export type ListPackagesParams = {
  subject?: string;
  q?: string;
};

export const listQuestions = async (params?: ListQuestionsParams) =>
  questionListSchema.parse(await apiGet("/api/questions", params));

export const getQuestion = async (id: string) =>
  questionSchema.parse(await apiGet(`/api/questions/${id}`));

export const createQuestion = async (payload: QuestionPayload) => {
  const created = await apiPost<QuestionPayload>("/api/questions", payload);
  if (created && typeof created === "object" && "id" in created) {
    return getQuestion(String(created.id));
  }
  return questionSchema.parse(created);
};

export const updateQuestion = async (id: string, payload: QuestionPayload) => {
  const updated = await apiPatch<QuestionPayload>(
    `/api/questions/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return getQuestion(String(updated.id));
  }
  return questionSchema.parse(updated);
};

export const deleteQuestion = (id: string) =>
  apiDelete<{ id: string }>(`/api/questions/${id}`);

export const listQuestionPackages = async (params?: ListPackagesParams) =>
  questionPackageListSchema.parse(await apiGet("/api/question-packages", params));

export const getQuestionPackage = async (id: string) =>
  questionPackageSchema.parse(await apiGet(`/api/question-packages/${id}`));

export const createQuestionPackage = async (payload: QuestionPayload) => {
  const created = await apiPost<QuestionPayload>(
    "/api/question-packages",
    payload
  );
  if (created && typeof created === "object" && "id" in created) {
    return getQuestionPackage(String(created.id));
  }
  return questionPackageSchema.parse(created);
};

export const updateQuestionPackage = async (
  id: string,
  payload: QuestionPayload
) => {
  const updated = await apiPatch<QuestionPayload>(
    `/api/question-packages/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return getQuestionPackage(String(updated.id));
  }
  return questionPackageSchema.parse(updated);
};

export const deleteQuestionPackage = (id: string) =>
  apiDelete<{ id: string }>(`/api/question-packages/${id}`);

export const setPackageQuestions = (id: string, questionIds: string[]) =>
  apiPut<QuestionPayload>(`/api/question-packages/${id}/questions`, {
    questionIds,
  });

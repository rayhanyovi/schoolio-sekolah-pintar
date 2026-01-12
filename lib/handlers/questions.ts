import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client";

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

export const listQuestions = (params?: ListQuestionsParams) =>
  apiGet<QuestionPayload[]>("/api/questions", params);

export const getQuestion = (id: string) =>
  apiGet<QuestionPayload>(`/api/questions/${id}`);

export const createQuestion = (payload: QuestionPayload) =>
  apiPost<QuestionPayload>("/api/questions", payload);

export const updateQuestion = (id: string, payload: QuestionPayload) =>
  apiPatch<QuestionPayload>(`/api/questions/${id}`, payload);

export const deleteQuestion = (id: string) =>
  apiDelete<{ id: string }>(`/api/questions/${id}`);

export const listQuestionPackages = (params?: ListPackagesParams) =>
  apiGet<QuestionPayload[]>("/api/question-packages", params);

export const getQuestionPackage = (id: string) =>
  apiGet<QuestionPayload>(`/api/question-packages/${id}`);

export const createQuestionPackage = (payload: QuestionPayload) =>
  apiPost<QuestionPayload>("/api/question-packages", payload);

export const updateQuestionPackage = (id: string, payload: QuestionPayload) =>
  apiPatch<QuestionPayload>(`/api/question-packages/${id}`, payload);

export const deleteQuestionPackage = (id: string) =>
  apiDelete<{ id: string }>(`/api/question-packages/${id}`);

export const setPackageQuestions = (id: string, questionIds: string[]) =>
  apiPut<QuestionPayload>(`/api/question-packages/${id}/questions`, {
    questionIds,
  });

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type ForumPayload = Record<string, unknown>;

export type ListThreadsParams = {
  subjectId?: string;
  status?: string;
  q?: string;
};

export const listThreads = (params?: ListThreadsParams) =>
  apiGet<ForumPayload[]>("/api/forum/threads", params);

export const getThread = (id: string) =>
  apiGet<ForumPayload>(`/api/forum/threads/${id}`);

export const createThread = (payload: ForumPayload) =>
  apiPost<ForumPayload>("/api/forum/threads", payload);

export const updateThread = (id: string, payload: ForumPayload) =>
  apiPatch<ForumPayload>(`/api/forum/threads/${id}`, payload);

export const deleteThread = (id: string) =>
  apiDelete<{ id: string }>(`/api/forum/threads/${id}`);

export const listReplies = (threadId: string) =>
  apiGet<ForumPayload[]>(`/api/forum/threads/${threadId}/replies`);

export const createReply = (threadId: string, payload: ForumPayload) =>
  apiPost<ForumPayload>(`/api/forum/threads/${threadId}/replies`, payload);

export const updateReply = (id: string, payload: ForumPayload) =>
  apiPatch<ForumPayload>(`/api/forum/replies/${id}`, payload);

export const toggleThreadPin = (id: string, value?: boolean) =>
  apiPost<ForumPayload>(`/api/forum/threads/${id}/pin`, { value });

export const toggleThreadLock = (id: string, value?: boolean) =>
  apiPost<ForumPayload>(`/api/forum/threads/${id}/lock`, { value });

export const upvoteThread = (id: string, delta = 1) =>
  apiPost<ForumPayload>(`/api/forum/threads/${id}/upvote`, { delta });

export const upvoteReply = (id: string, delta = 1) =>
  apiPost<ForumPayload>(`/api/forum/replies/${id}/upvote`, { delta });

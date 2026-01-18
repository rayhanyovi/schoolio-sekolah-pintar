import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import {
  forumReplyListSchema,
  forumReplySchema,
  forumThreadListSchema,
  forumThreadSchema,
} from "@/lib/schemas";

export type ForumPayload = Record<string, unknown>;

export type ListThreadsParams = {
  subjectId?: string;
  status?: string;
  q?: string;
};

export const listThreads = async (params?: ListThreadsParams) =>
  forumThreadListSchema.parse(await apiGet("/api/forum/threads", params));

export const getThread = async (id: string) =>
  forumThreadSchema.parse(await apiGet(`/api/forum/threads/${id}`));

export const createThread = async (payload: ForumPayload) => {
  const created = await apiPost<ForumPayload>("/api/forum/threads", payload);
  if (created && typeof created === "object" && "id" in created) {
    return getThread(String(created.id));
  }
  return forumThreadSchema.parse(created);
};

export const updateThread = async (id: string, payload: ForumPayload) => {
  const updated = await apiPatch<ForumPayload>(
    `/api/forum/threads/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return getThread(String(updated.id));
  }
  return forumThreadSchema.parse(updated);
};

export const deleteThread = (id: string) =>
  apiDelete<{ id: string }>(`/api/forum/threads/${id}`);

export const listReplies = async (threadId: string) =>
  forumReplyListSchema.parse(
    await apiGet(`/api/forum/threads/${threadId}/replies`)
  );

export const createReply = async (threadId: string, payload: ForumPayload) => {
  const created = await apiPost<ForumPayload>(
    `/api/forum/threads/${threadId}/replies`,
    payload
  );
  if (created && typeof created === "object" && "id" in created) {
    const replies = await listReplies(threadId);
    const match = replies.find((reply) => reply.id === created.id);
    if (match) return match;
  }
  return forumReplySchema.parse(created);
};

export const updateReply = async (id: string, payload: ForumPayload) => {
  const updated = await apiPatch<ForumPayload>(
    `/api/forum/replies/${id}`,
    payload
  );
  if (updated && typeof updated === "object" && "id" in updated) {
    return forumReplySchema.parse(updated);
  }
  return forumReplySchema.parse(updated);
};

export const toggleThreadPin = (id: string, value?: boolean) =>
  apiPost<ForumPayload>(`/api/forum/threads/${id}/pin`, { value });

export const toggleThreadLock = (id: string, value?: boolean) =>
  apiPost<ForumPayload>(`/api/forum/threads/${id}/lock`, { value });

export const upvoteThread = (id: string, delta = 1) =>
  apiPost<ForumPayload>(`/api/forum/threads/${id}/upvote`, { delta });

export const upvoteReply = (id: string, delta = 1) =>
  apiPost<ForumPayload>(`/api/forum/replies/${id}/upvote`, { delta });

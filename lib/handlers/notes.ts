import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type NotePayload = Record<string, unknown>;

export type ListNotesParams = {
  visibility?: string;
  subjectId?: string;
  q?: string;
};

export const listNotes = (params?: ListNotesParams) =>
  apiGet<NotePayload[]>("/api/notes", params);

export const getNote = (id: string) => apiGet<NotePayload>(`/api/notes/${id}`);

export const createNote = (payload: NotePayload) =>
  apiPost<NotePayload>("/api/notes", payload);

export const updateNote = (id: string, payload: NotePayload) =>
  apiPatch<NotePayload>(`/api/notes/${id}`, payload);

export const deleteNote = (id: string) =>
  apiDelete<{ id: string }>(`/api/notes/${id}`);

export const toggleNotePin = (id: string, value?: boolean) =>
  apiPost<NotePayload>(`/api/notes/${id}/pin`, { value });

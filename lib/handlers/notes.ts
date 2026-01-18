import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { noteListSchema, noteSchema } from "@/lib/schemas";

export type NotePayload = Record<string, unknown>;

export type ListNotesParams = {
  visibility?: string;
  subjectId?: string;
  q?: string;
};

export const listNotes = async (params?: ListNotesParams) =>
  noteListSchema.parse(await apiGet("/api/notes", params));

export const getNote = async (id: string) =>
  noteSchema.parse(await apiGet(`/api/notes/${id}`));

export const createNote = async (payload: NotePayload) => {
  const created = await apiPost<NotePayload>("/api/notes", payload);
  if (created && typeof created === "object" && "id" in created) {
    return getNote(String(created.id));
  }
  return noteSchema.parse(created);
};

export const updateNote = async (id: string, payload: NotePayload) => {
  const updated = await apiPatch<NotePayload>(`/api/notes/${id}`, payload);
  if (updated && typeof updated === "object" && "id" in updated) {
    return getNote(String(updated.id));
  }
  return noteSchema.parse(updated);
};

export const deleteNote = (id: string) =>
  apiDelete<{ id: string }>(`/api/notes/${id}`);

export const toggleNotePin = (id: string, value?: boolean) =>
  apiPost<NotePayload>(`/api/notes/${id}/pin`, { value });

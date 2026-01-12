import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { userListSchema, userSchema } from "@/lib/schemas";

export type ListUsersParams = {
  role?: string;
  classId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export const listUsers = async (params?: ListUsersParams) =>
  userListSchema.parse(await apiGet("/api/users", params));

export const getUser = async (id: string) =>
  userSchema.parse(await apiGet(`/api/users/${id}`));

export const createUser = async (payload: Record<string, unknown>) =>
  userSchema.parse(await apiPost("/api/users", payload));

export const updateUser = async (id: string, payload: Record<string, unknown>) =>
  userSchema.parse(await apiPatch(`/api/users/${id}`, payload));

export const deleteUser = (id: string) =>
  apiDelete<{ id: string }>(`/api/users/${id}`);

export const getUserProfile = (id: string) =>
  apiGet<Record<string, unknown>>(`/api/users/${id}/profile`);

export const updateUserProfile = (id: string, payload: Record<string, unknown>) =>
  apiPatch<Record<string, unknown>>(`/api/users/${id}/profile`, payload);

export const linkParentStudent = (parentId: string, studentId: string) =>
  apiPost<Record<string, unknown>>("/api/parent-links", {
    parentId,
    studentId,
  });

export const unlinkParentStudent = (parentId: string, studentId: string) =>
  apiDelete<Record<string, unknown>>("/api/parent-links", {
    parentId,
    studentId,
  });

export const listStudents = async (params?: { classId?: string; q?: string }) =>
  userListSchema.parse(await apiGet("/api/students", params));

export const listTeachers = async (params?: { q?: string }) =>
  userListSchema.parse(await apiGet("/api/teachers", params));

export const listParents = async (params?: { q?: string }) =>
  userListSchema.parse(await apiGet("/api/parents", params));

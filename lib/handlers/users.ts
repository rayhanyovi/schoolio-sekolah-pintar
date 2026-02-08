import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { userListSchema, userProfileSchema, userSchema } from "@/lib/schemas";

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

export type CreateUserPayload = {
  name: string;
  email?: string | null;
  role: string;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | Date | null;
  classId?: string | null;
  gender?: string | null;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export const createUser = async (payload: CreateUserPayload) =>
  userSchema.parse(await apiPost("/api/users", payload));

export const updateUser = async (id: string, payload: UpdateUserPayload) =>
  userSchema.parse(await apiPatch(`/api/users/${id}`, payload));

export const deleteUser = (id: string) =>
  apiDelete<{ id: string }>(`/api/users/${id}`);

export type UserProfilePayload = {
  name?: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatarUrl?: string | null;
  birthDate?: string | Date | null;
  studentProfile?: {
    classId?: string | null;
    gender?: string | null;
  };
  teacherProfile?: {
    title?: string | null;
  };
  parentProfile?: {
    enabled?: boolean;
  };
};

export const getUserProfile = async (id: string) =>
  userProfileSchema.parse(await apiGet(`/api/users/${id}/profile`));

export const updateUserProfile = async (id: string, payload: UserProfilePayload) =>
  userProfileSchema.parse(await apiPatch(`/api/users/${id}/profile`, payload));

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

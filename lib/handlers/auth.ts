import { apiGet, apiPost } from "@/lib/api-client";
import {
  authLoginResultSchema,
  authSessionSchema,
  forgotPasswordResultSchema,
  onboardingCompleteResultSchema,
  onboardingLinkChildResultSchema,
  onboardingStatusSchema,
} from "@/lib/schemas";

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  confirmPassword: string;
  parentInviteCode?: string;
};

export type SelectOnboardingRolePayload = {
  name?: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  schoolId?: string;
  schoolCode?: string;
  studentCode?: string;
};

export const login = async (payload: LoginPayload) =>
  authLoginResultSchema.parse(await apiPost("/api/auth/login", payload));

export const register = async (payload: RegisterPayload) =>
  authLoginResultSchema.parse(await apiPost("/api/auth/register", payload));

export const getAuthSession = async () =>
  authSessionSchema.parse(await apiGet("/api/auth/session"));

export const forgotPassword = async (email: string) =>
  forgotPasswordResultSchema.parse(
    await apiPost("/api/auth/forgot-password", { email })
  );

export const resetPassword = async (payload: {
  token: string;
  password: string;
  confirmPassword: string;
}) => apiPost("/api/auth/reset-password", payload);

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => apiPost("/api/auth/change-password", payload);

export const getOnboardingStatus = async () =>
  onboardingStatusSchema.parse(await apiGet("/api/auth/onboarding"));

export const completeOnboarding = async () =>
  onboardingCompleteResultSchema.parse(
    await apiPost("/api/auth/onboarding/complete")
  );

export const selectOnboardingRole = async (
  payload: SelectOnboardingRolePayload
) => authLoginResultSchema.parse(await apiPost("/api/auth/onboarding/select-role", payload));

export const linkOnboardingChild = async (studentId: string) =>
  onboardingLinkChildResultSchema.parse(
    await apiPost("/api/auth/onboarding/link-child", { studentId })
  );

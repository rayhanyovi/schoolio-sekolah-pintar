import { apiGet, apiPost } from "@/lib/api-client";
import {
  authLoginResultSchema,
  authSessionSchema,
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
  name: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  schoolCode?: string;
};

export const login = async (payload: LoginPayload) =>
  authLoginResultSchema.parse(await apiPost("/api/auth/login", payload));

export const register = async (payload: RegisterPayload) =>
  authLoginResultSchema.parse(await apiPost("/api/auth/register", payload));

export const getAuthSession = async () =>
  authSessionSchema.parse(await apiGet("/api/auth/session"));

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

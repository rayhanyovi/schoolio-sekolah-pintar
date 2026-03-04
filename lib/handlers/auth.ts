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
  name: string;
  identifier: string;
  password: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  schoolCode?: string;
  childStudentId?: string;
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

export const linkOnboardingChild = async (studentId: string) =>
  onboardingLinkChildResultSchema.parse(
    await apiPost("/api/auth/onboarding/link-child", { studentId })
  );

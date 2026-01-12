import { apiGet, apiPatch } from "@/lib/api-client";

export type SettingsPayload = Record<string, unknown>;

export const getSchoolProfile = () =>
  apiGet<SettingsPayload>("/api/settings/school-profile");

export const updateSchoolProfile = (payload: SettingsPayload) =>
  apiPatch<SettingsPayload>("/api/settings/school-profile", payload);

export const getScheduleTemplates = () =>
  apiGet<SettingsPayload[]>("/api/schedule-templates");

export const updateScheduleTemplates = (templates: SettingsPayload[]) =>
  apiPatch<SettingsPayload>("/api/schedule-templates", { templates });

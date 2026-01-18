import { apiGet, apiPatch } from "@/lib/api-client";
import {
  scheduleTemplateListSchema,
  schoolProfileSchema,
} from "@/lib/schemas";

export type SettingsPayload = Record<string, unknown>;

export const getSchoolProfile = async () =>
  schoolProfileSchema.parse(await apiGet("/api/settings/school-profile"));

export const updateSchoolProfile = async (payload: SettingsPayload) =>
  schoolProfileSchema.parse(
    await apiPatch("/api/settings/school-profile", payload)
  );

export const getScheduleTemplates = async () =>
  scheduleTemplateListSchema.parse(await apiGet("/api/schedule-templates"));

export const updateScheduleTemplates = async (templates: SettingsPayload[]) =>
  scheduleTemplateListSchema.parse(
    await apiPatch("/api/schedule-templates", { templates })
  );

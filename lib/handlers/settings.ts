import { apiGet, apiPatch } from "@/lib/api-client";
import {
  notificationPreferenceSchema,
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

export const getNotificationPreferences = async () =>
  notificationPreferenceSchema.parse(await apiGet("/api/settings/notifications"));

export const updateNotificationPreferences = async (payload: {
  emailNotifications?: boolean;
  assignmentReminders?: boolean;
  attendanceAlerts?: boolean;
  gradePublished?: boolean;
}) =>
  notificationPreferenceSchema.parse(
    await apiPatch("/api/settings/notifications", payload)
  );

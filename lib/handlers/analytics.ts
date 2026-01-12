import { apiGet } from "@/lib/api-client";
import {
  analyticsAttendanceSchema,
  analyticsDemographicsSchema,
  analyticsGradesSchema,
  analyticsOverviewSchema,
} from "@/lib/schemas";

export const getAnalyticsOverview = () =>
  apiGet("/api/analytics/overview").then((data) =>
    analyticsOverviewSchema.parse(data)
  );

export const getAnalyticsAttendance = (params?: { from?: string; to?: string }) =>
  apiGet("/api/analytics/attendance", params).then((data) =>
    analyticsAttendanceSchema.parse(data)
  );

export const getAnalyticsGrades = (params?: { from?: string; to?: string }) =>
  apiGet("/api/analytics/grades", params).then((data) =>
    analyticsGradesSchema.parse(data)
  );

export const getAnalyticsDemographics = () =>
  apiGet("/api/analytics/demographics").then((data) =>
    analyticsDemographicsSchema.parse(data)
  );

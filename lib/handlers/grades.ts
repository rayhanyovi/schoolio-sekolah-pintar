import { apiGet } from "@/lib/api-client";
import { gradeListSchema, gradeSummaryListSchema } from "@/lib/schemas";

export type GradePayload = Record<string, unknown>;

export type ListGradesParams = {
  classId?: string;
  subjectId?: string;
  studentId?: string;
  termId?: string;
};

export const listGrades = async (params?: ListGradesParams) =>
  gradeListSchema.parse(await apiGet("/api/grades", params));

export const getGradesSummary = async (params?: {
  classId?: string;
  subjectId?: string;
}) => gradeSummaryListSchema.parse(await apiGet("/api/grades/summary", params));

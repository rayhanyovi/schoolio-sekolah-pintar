import { apiGet } from "@/lib/api-client";

export type GradePayload = Record<string, unknown>;

export type ListGradesParams = {
  classId?: string;
  subjectId?: string;
  studentId?: string;
  termId?: string;
};

export const listGrades = (params?: ListGradesParams) =>
  apiGet<GradePayload[]>("/api/grades", params);

export const getGradesSummary = (params?: {
  classId?: string;
  subjectId?: string;
}) => apiGet<GradePayload[]>("/api/grades/summary", params);

import { apiGet, apiPatch } from "@/lib/api-client";
import {
  gradeListSchema,
  gradeSummaryListSchema,
  gradeWeightListSchema,
  gradeWeightSchema,
} from "@/lib/schemas";

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
  semester?: string;
}) => gradeSummaryListSchema.parse(await apiGet("/api/grades/summary", params));

export const listGradeWeights = async (params?: {
  classId?: string;
  subjectId?: string;
  semester?: string;
}) => gradeWeightListSchema.parse(await apiGet("/api/grades/weights", params));

export const upsertGradeWeight = async (payload: {
  subjectId: string;
  classId: string;
  semester: string;
  homeworkWeight: number;
  quizWeight: number;
  examWeight: number;
  practicalWeight: number;
}) => gradeWeightSchema.parse(await apiPatch("/api/grades/weights", payload));

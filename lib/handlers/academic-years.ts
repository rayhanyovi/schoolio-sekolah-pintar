import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { academicYearListSchema, academicYearSchema } from "@/lib/schemas";

export type AcademicYearPayload = Record<string, unknown>;

export const listAcademicYears = async () =>
  academicYearListSchema.parse(await apiGet("/api/academic-years"));

export const getAcademicYear = async (id: string) =>
  academicYearSchema.parse(await apiGet(`/api/academic-years/${id}`));

export const createAcademicYear = async (payload: AcademicYearPayload) =>
  academicYearSchema.parse(await apiPost("/api/academic-years", payload));

export const updateAcademicYear = async (
  id: string,
  payload: AcademicYearPayload
) => academicYearSchema.parse(await apiPatch(`/api/academic-years/${id}`, payload));

export const deleteAcademicYear = (id: string) =>
  apiDelete<{ id: string }>(`/api/academic-years/${id}`);

export const activateAcademicYear = async (id: string) =>
  academicYearSchema.parse(await apiPost(`/api/academic-years/${id}/activate`));

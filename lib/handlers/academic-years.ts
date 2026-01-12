import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type AcademicYearPayload = Record<string, unknown>;

export const listAcademicYears = () =>
  apiGet<AcademicYearPayload[]>("/api/academic-years");

export const getAcademicYear = (id: string) =>
  apiGet<AcademicYearPayload>(`/api/academic-years/${id}`);

export const createAcademicYear = (payload: AcademicYearPayload) =>
  apiPost<AcademicYearPayload>("/api/academic-years", payload);

export const updateAcademicYear = (id: string, payload: AcademicYearPayload) =>
  apiPatch<AcademicYearPayload>(`/api/academic-years/${id}`, payload);

export const deleteAcademicYear = (id: string) =>
  apiDelete<{ id: string }>(`/api/academic-years/${id}`);

export const activateAcademicYear = (id: string) =>
  apiPost<AcademicYearPayload>(`/api/academic-years/${id}/activate`);

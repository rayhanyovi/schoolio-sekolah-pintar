import { apiPost } from "@/lib/api-client";
import { authLoginResultSchema } from "@/lib/schemas";

export type DemoSessionPayload = {
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
};

export const startDemoSession = async (payload: DemoSessionPayload) =>
  authLoginResultSchema.parse(await apiPost("/api/demo/session", payload));


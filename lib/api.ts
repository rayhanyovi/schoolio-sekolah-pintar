import { NextResponse } from "next/server";
import { requireAuth as resolveAuthSession } from "@/lib/server-auth";
import { Role } from "@/lib/constants";
import { ActorContext, hasAnyRole, toActorContext } from "@/lib/authz";
import { monitorApiError } from "@/lib/error-monitoring";
import { ZodType, z } from "zod";

export const isMockEnabled = () => process.env.debug_with_mock_data === "true";

export const jsonOk = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ data }, init);

export const jsonError = (code: string, message: string, status = 400) => {
  const severity = monitorApiError({ code, message, status });
  return NextResponse.json({ error: { code, message, severity } }, { status });
};

export const parseNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const requireAuth = async (
  request: Request
): Promise<ActorContext | NextResponse> => {
  const session = await resolveAuthSession(request);
  if (!session) {
    return jsonError("UNAUTHORIZED", "Authentication required", 401);
  }
  return toActorContext(session);
};

export const requireRole = (
  actor: ActorContext,
  roles: Role[]
): NextResponse | null => {
  if (hasAnyRole(actor, roles)) return null;
  return jsonError("FORBIDDEN", "You are not allowed to perform this action", 403);
};

const toValidationMessage = (error: z.ZodError) =>
  error.issues[0]?.message ?? "Payload tidak valid";

export const parseJsonBody = async <T>(
  request: Request,
  schema: ZodType<T>
): Promise<T | NextResponse> => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("VALIDATION_ERROR", "Body JSON tidak valid", 400);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", toValidationMessage(parsed.error), 400);
  }
  return parsed.data;
};

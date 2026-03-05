import { NextResponse } from "next/server";
import { requireAuth as resolveAuthSession } from "@/lib/server-auth";
import { Role } from "@/lib/constants";
import { ActorContext, hasAnyRole, toActorContext } from "@/lib/authz";
import { monitorApiError } from "@/lib/error-monitoring";
import { ZodType, z } from "zod";

export const isMockEnabled = () => process.env.DEBUG_WITH_MOCK_DATA === "true";

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
  request: Request,
): Promise<ActorContext | NextResponse> => {
  const session = await resolveAuthSession(request);
  if (!session) {
    return jsonError("UNAUTHORIZED", "Authentication required", 401);
  }
  return toActorContext(session);
};

export const requireRole = (
  actor: ActorContext,
  roles: Role[],
): NextResponse | null => {
  if (hasAnyRole(actor, roles)) return null;
  return jsonError(
    "FORBIDDEN",
    "You are not allowed to perform this action",
    403,
  );
};

export const requireSchoolContext = (
  actor: ActorContext,
): string | NextResponse => {
  if (!actor.schoolId) {
    return jsonError(
      "FORBIDDEN",
      "Akun belum tergabung ke sekolah",
      403,
    );
  }
  return actor.schoolId;
};

const toValidationMessage = (error: z.ZodError) =>
  error.issues[0]?.message ?? "Payload tidak valid";

export const parseJsonBody = async <T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T | NextResponse> => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("VALIDATION_ERROR", "Body JSON tidak valid", 400);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      toValidationMessage(parsed.error),
      400,
    );
  }
  return parsed.data;
};

export const parseJsonRecordBody = (
  request: Request,
): Promise<Record<string, unknown> | NextResponse> =>
  parseJsonBody(request, z.record(z.unknown()));

export const parseJsonRecordBodyAllowEmpty = async (
  request: Request,
): Promise<Record<string, unknown> | NextResponse> => {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonError("VALIDATION_ERROR", "Body JSON tidak valid", 400);
  }

  if (!rawBody.trim()) {
    return {};
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError("VALIDATION_ERROR", "Body JSON tidak valid", 400);
  }

  const parsed = z.record(z.unknown()).safeParse(payload);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      toValidationMessage(parsed.error),
      400,
    );
  }
  return parsed.data;
};

export const parseJsonRecordArrayBody = (
  request: Request,
): Promise<Record<string, unknown>[] | NextResponse> =>
  parseJsonBody(request, z.array(z.record(z.unknown())));

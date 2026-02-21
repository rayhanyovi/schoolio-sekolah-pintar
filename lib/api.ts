import { NextResponse } from "next/server";
import { requireAuth as resolveAuthSession } from "@/lib/server-auth";
import { Role } from "@/lib/constants";
import { ActorContext, hasAnyRole, toActorContext } from "@/lib/authz";

export const isMockEnabled = () => process.env.debug_with_mock_data === "true";

export const jsonOk = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ data }, init);

export const jsonError = (code: string, message: string, status = 400) =>
  NextResponse.json({ error: { code, message } }, { status });

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

import { NextResponse } from "next/server";
import { AuthSession, requireAuth as resolveAuthSession } from "@/lib/server-auth";

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
): Promise<AuthSession | NextResponse> => {
  const session = await resolveAuthSession(request);
  if (!session) {
    return jsonError("UNAUTHORIZED", "Authentication required", 401);
  }
  return session;
};

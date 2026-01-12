import { NextResponse } from "next/server";

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

import type { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE_NAME = "schoolio_csrf";
export const CSRF_HEADER_NAME = "X-CSRF-Token";
export const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

const CSRF_TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_CSRF_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);
const FALSE_VALUES = new Set(["false", "0", "no", "off"]);

export const isSafeCsrfMethod = (method: string) =>
  SAFE_CSRF_METHODS.has(method.toUpperCase());

export const createCsrfToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

export const isValidCsrfToken = (token: string | null | undefined) =>
  typeof token === "string" && CSRF_TOKEN_PATTERN.test(token);

export const getCsrfTokenFromCookie = (cookieHeader?: string) => {
  const source =
    cookieHeader ??
    (typeof document === "undefined" ? "" : document.cookie);
  const parts = source.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey !== CSRF_COOKIE_NAME) continue;
    let value: string;
    try {
      value = decodeURIComponent(rawValue.join("="));
    } catch {
      return null;
    }
    return isValidCsrfToken(value) ? value : null;
  }
  return null;
};

export const getRequestCsrfCookie = (request: NextRequest) => {
  const token = request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;
  return isValidCsrfToken(token) ? token : null;
};

export const getRequestCsrfHeader = (request: NextRequest) => {
  const token = request.headers.get(CSRF_HEADER_NAME);
  return isValidCsrfToken(token) ? token : null;
};

export const getOrCreateRequestCsrfToken = (request: NextRequest) =>
  getRequestCsrfCookie(request) ?? createCsrfToken();

export const shouldUseSecureCsrfCookie = () => {
  const configuredValue = process.env.CSRF_COOKIE_SECURE?.trim().toLowerCase();

  if (configuredValue) {
    if (TRUE_VALUES.has(configuredValue)) return true;
    if (FALSE_VALUES.has(configuredValue)) return false;
  }

  return process.env.NODE_ENV === "production";
};

export const setCsrfCookie = <T extends NextResponse>(
  response: T,
  token: string
) => {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: shouldUseSecureCsrfCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
};

export const hasValidCsrfTokenPair = (request: NextRequest) => {
  const cookieToken = getRequestCsrfCookie(request);
  const headerToken = getRequestCsrfHeader(request);
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
};

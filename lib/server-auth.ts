import { NextRequest } from "next/server";
import { Role, ROLES } from "@/lib/constants";

export const SESSION_COOKIE_NAME = "schoolio_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "schoolio-dev-secret-change-me";

type SessionTokenPayload = {
  userId: string;
  name: string;
  role: Role;
  canUseDebugPanel: boolean;
  iat: number;
  exp: number;
};

export type AuthSession = {
  userId: string;
  name: string;
  role: Role;
  canUseDebugPanel: boolean;
  issuedAt: number;
  expiresAt: number;
};

type SessionInput = {
  userId: string;
  name: string;
  role: Role;
  canUseDebugPanel: boolean;
};

const roles = new Set<Role>(Object.values(ROLES));
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  try {
    const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
};

const toEncodedPayload = (payload: SessionTokenPayload) =>
  toBase64Url(encoder.encode(JSON.stringify(payload)));

const parseEncodedPayload = (encodedPayload: string) => {
  const decoded = fromBase64Url(encodedPayload);
  if (!decoded) return null;

  try {
    return JSON.parse(decoder.decode(decoded)) as Partial<SessionTokenPayload>;
  } catch {
    return null;
  }
};

const getSigningKey = async (usage: "sign" | "verify") =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );

const signPayload = async (encodedPayload: string) => {
  const key = await getSigningKey("sign");
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );
  return toBase64Url(new Uint8Array(signatureBuffer));
};

const verifySignature = async (encodedPayload: string, signature: string) => {
  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return false;

  const key = await getSigningKey("verify");
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(encodedPayload)
  );
};

const parseCookieValue = (cookieHeader: string | null, key: string) => {
  if (!cookieHeader) return null;
  const chunks = cookieHeader.split(";");
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith(`${key}=`)) continue;
    const rawValue = trimmed.slice(key.length + 1);
    return rawValue.length ? decodeURIComponent(rawValue) : null;
  }
  return null;
};

const getTokenFromRequest = (request: Request | NextRequest) => {
  const requestWithCookies = request as NextRequest;
  if (requestWithCookies.cookies?.get) {
    return requestWithCookies.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  }
  return parseCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME);
};

const toSession = (payload: Partial<SessionTokenPayload>): AuthSession | null => {
  if (
    typeof payload.userId !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.canUseDebugPanel !== "boolean" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (!roles.has(payload.role as Role)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;

  return {
    userId: payload.userId,
    name: payload.name,
    role: payload.role as Role,
    canUseDebugPanel: payload.canUseDebugPanel,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };
};

export const isDebugImpersonationEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_DEBUG_IMPERSONATION === "true" ||
  process.env.NEXT_PUBLIC_ENABLE_DEBUG_IMPERSONATION === "true";

export const createSessionToken = async (session: SessionInput) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    ...session,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const encodedPayload = toEncodedPayload(payload);
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = async (token: string | null | undefined) => {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const isValid = await verifySignature(encodedPayload, signature);
  if (!isValid) return null;

  const payload = parseEncodedPayload(encodedPayload);
  if (!payload) return null;
  return toSession(payload);
};

export const getSessionFromRequest = async (request: Request | NextRequest) => {
  const token = getTokenFromRequest(request);
  return verifySessionToken(token);
};

export const requireAuth = async (request: Request | NextRequest) => {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return null;
  }
  return session;
};

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

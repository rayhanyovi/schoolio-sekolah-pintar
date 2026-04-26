import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";

type Bucket = {
  tokens: number;
  updatedAt: number;
};

export type RateLimitPolicy = {
  name: string;
  limit: number;
  windowMs: number;
};

type RateLimitInput = {
  request: Request;
  policy: RateLimitPolicy;
  identifier?: string | null;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, Bucket>();

export const RATE_LIMIT_POLICIES = {
  authLogin: {
    name: "auth:login",
    limit: 10,
    windowMs: 60 * 1000,
  },
  authRegister: {
    name: "auth:register",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  },
  authForgotPassword: {
    name: "auth:forgot-password",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
  authResetPassword: {
    name: "auth:reset-password",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  },
  authChangePassword: {
    name: "auth:change-password",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  },
  uploadIntent: {
    name: "uploads:intent",
    limit: 30,
    windowMs: 60 * 1000,
  },
  uploadContent: {
    name: "uploads:content",
    limit: 20,
    windowMs: 60 * 1000,
  },
  uploadConfirm: {
    name: "uploads:confirm",
    limit: 30,
    windowMs: 60 * 1000,
  },
} satisfies Record<string, RateLimitPolicy>;

const hashKeyPart = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const getClientRateLimitKey = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor
    ?.split(",")
    .map((value) => value.trim())
    .find(Boolean);
  const ip =
    forwardedIp ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local";

  return `ip:${ip}`;
};

const buildBucketKey = (
  request: Request,
  policy: RateLimitPolicy,
  identifier?: string | null
) => {
  const parts = [policy.name, getClientRateLimitKey(request)];
  const normalizedIdentifier = identifier?.trim().toLowerCase();
  if (normalizedIdentifier) {
    parts.push(`id:${hashKeyPart(normalizedIdentifier)}`);
  }
  return parts.join(":");
};

export const consumeRateLimit = ({
  request,
  policy,
  identifier,
  now = Date.now(),
}: RateLimitInput): RateLimitResult => {
  const key = buildBucketKey(request, policy, identifier);
  const refillRate = policy.limit / policy.windowMs;
  const current = buckets.get(key) ?? {
    tokens: policy.limit,
    updatedAt: now,
  };
  const elapsedMs = Math.max(0, now - current.updatedAt);
  const tokens = Math.min(
    policy.limit,
    current.tokens + elapsedMs * refillRate
  );

  if (tokens < 1) {
    const retryAfterMs = Math.ceil((1 - tokens) / refillRate);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    buckets.set(key, {
      tokens,
      updatedAt: now,
    });
    return {
      allowed: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: now + retryAfterMs,
      retryAfterSeconds,
    };
  }

  const remainingTokens = tokens - 1;
  buckets.set(key, {
    tokens: remainingTokens,
    updatedAt: now,
  });

  return {
    allowed: true,
    limit: policy.limit,
    remaining: Math.floor(remainingTokens),
    resetAt:
      remainingTokens >= policy.limit
        ? now
        : now + Math.ceil((policy.limit - remainingTokens) / refillRate),
    retryAfterSeconds: 0,
  };
};

export const toRateLimitHeaders = (result: RateLimitResult) => ({
  "RateLimit-Limit": String(result.limit),
  "RateLimit-Remaining": String(result.remaining),
  "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  ...(result.retryAfterSeconds > 0
    ? { "Retry-After": String(result.retryAfterSeconds) }
    : {}),
});

export const applyRateLimitHeaders = <T extends NextResponse>(
  response: T,
  result: RateLimitResult
) => {
  const headers = toRateLimitHeaders(result);
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
  return response;
};

export const enforceRateLimit = (
  request: Request,
  policy: RateLimitPolicy,
  identifier?: string | null
) => {
  const result = consumeRateLimit({ request, policy, identifier });
  if (result.allowed) {
    return null;
  }

  const response = jsonError(
    "RATE_LIMITED",
    "Terlalu banyak percobaan. Coba lagi nanti.",
    429
  );
  return applyRateLimitHeaders(response, result);
};

export const resetRateLimitForTests = () => {
  buckets.clear();
};

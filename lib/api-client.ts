import {
  CSRF_HEADER_NAME,
  getCsrfTokenFromCookie,
  isSafeCsrfMethod,
} from "@/lib/csrf";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const DEFAULT_CACHE_TTL_MS = 30_000;
const SHORT_CACHE_TTL_MS = 10_000;
const MEDIUM_CACHE_TTL_MS = 15_000;
const LONG_CACHE_TTL_MS = 60_000;

const responseCache = new Map<string, CacheEntry>();
const inflightCache = new Map<string, Promise<unknown>>();

const stripQueryString = (value: string) => value.split("?")[0] ?? value;

const buildCacheKey = (method: string, url: string) =>
  `${method.toUpperCase()} ${url}`;

const clearExpiredCacheEntries = (now = Date.now()) => {
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key);
    }
  }
};

const getCacheTtlMs = (path: string) => {
  const normalizedPath = stripQueryString(path);

  if (
    normalizedPath === "/api/auth/session" ||
    normalizedPath.startsWith("/api/auth/onboarding")
  ) {
    return 0;
  }

  if (
    normalizedPath.startsWith("/api/metrics") ||
    normalizedPath.startsWith("/api/notifications")
  ) {
    return SHORT_CACHE_TTL_MS;
  }

  if (
    normalizedPath.startsWith("/api/attendance") ||
    normalizedPath.startsWith("/api/teacher-attendance")
  ) {
    return MEDIUM_CACHE_TTL_MS;
  }

  if (
    normalizedPath.startsWith("/api/settings") ||
    normalizedPath.startsWith("/api/schedule-templates")
  ) {
    return LONG_CACHE_TTL_MS;
  }

  return DEFAULT_CACHE_TTL_MS;
};

export const invalidateApiCache = () => {
  responseCache.clear();
  inflightCache.clear();
};

const buildQuery = (params?: QueryParams) => {
  if (!params) return "";
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const encodedValue =
        typeof value === "boolean" ? String(value) : String(value);
      return `${encodeURIComponent(key)}=${encodeURIComponent(encodedValue)}`;
    });
  return entries.length ? `?${entries.join("&")}` : "";
};

const parseJson = (text: string): unknown => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const throwApiError = (status: number, payload: unknown) => {
  const payloadRecord = isObjectRecord(payload) ? payload : null;
  const payloadError = payloadRecord?.error;

  const error: ApiError =
    isObjectRecord(payloadError) &&
    typeof payloadError.code === "string" &&
    typeof payloadError.message === "string"
      ? {
          code: payloadError.code,
          message: payloadError.message,
          details: payloadError.details,
        }
      : {
          code: "HTTP_ERROR",
          message:
            typeof payloadRecord?.message === "string"
              ? payloadRecord.message
              : "Request failed",
        };
  const err = new Error(error.message) as Error & {
    code?: string;
    status?: number;
    details?: unknown;
  };
  err.code = error.code;
  err.status = status;
  err.details = error.details;
  throw err;
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {},
  params?: QueryParams
): Promise<T> => {
  const method = options.method ?? "GET";
  const url = `${path}${buildQuery(params)}`;
  const shouldUseResponseCache = method === "GET";
  const cacheTtlMs = shouldUseResponseCache ? getCacheTtlMs(path) : 0;
  const cacheKey = buildCacheKey(method, url);
  const now = Date.now();

  if (shouldUseResponseCache && cacheTtlMs > 0) {
    clearExpiredCacheEntries(now);
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }

    const inflight = inflightCache.get(cacheKey);
    if (inflight) {
      return (await inflight) as T;
    }
  }

  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && !["GET", "HEAD"].includes(method);
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }
  if (!isSafeCsrfMethod(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  const executeRequest = async () => {
    const response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });

    const text = await response.text();
    const payload = parseJson(text);

    if (!response.ok) {
      throwApiError(response.status, payload);
    }

    if (payload && typeof payload === "object" && "error" in payload) {
      throwApiError(response.status, payload);
    }

    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data as T;
    }

    return payload as T;
  };

  if (!shouldUseResponseCache || cacheTtlMs <= 0) {
    const result = await executeRequest();
    if (!shouldUseResponseCache) {
      invalidateApiCache();
    }
    return result;
  }

  const requestPromise = executeRequest();
  inflightCache.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    responseCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + cacheTtlMs,
    });
    return result;
  } finally {
    inflightCache.delete(cacheKey);
  }
};

export const apiGet = <T>(path: string, params?: QueryParams) =>
  apiRequest<T>(path, { method: "GET" }, params);

export const apiPost = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "POST", body });

export const apiPatch = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "PATCH", body });

export const apiPut = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "PUT", body });

export const apiDelete = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "DELETE", body });

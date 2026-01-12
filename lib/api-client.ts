export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

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

const parseJson = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const throwApiError = (status: number, payload: any) => {
  const error: ApiError = payload?.error ?? {
    code: "HTTP_ERROR",
    message: payload?.message ?? "Request failed",
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
  options: { method?: string; body?: unknown; headers?: HeadersInit } = {},
  params?: QueryParams
): Promise<T> => {
  const method = options.method ?? "GET";
  const url = `${path}${buildQuery(params)}`;
  const headers: HeadersInit = {
    ...(options.headers ?? {}),
  };
  const hasBody = options.body !== undefined && !["GET", "HEAD"].includes(method);
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
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

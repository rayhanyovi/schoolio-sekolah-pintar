import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfToken,
  getCsrfTokenFromCookie,
  isSafeCsrfMethod,
  isValidCsrfToken,
  shouldUseSecureCsrfCookie,
} from "@/lib/csrf";
import { apiGet, apiPost } from "@/lib/api-client";
import { uploadContentWithSignedUrl } from "@/lib/handlers/uploads";

const TOKEN = "a".repeat(64);

describe("csrf helpers", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCsrfCookieSecure = process.env.CSRF_COOKIE_SECURE;

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalCsrfCookieSecure === undefined) {
      delete process.env.CSRF_COOKIE_SECURE;
    } else {
      process.env.CSRF_COOKIE_SECURE = originalCsrfCookieSecure;
    }
  });

  it("membuat token hex valid untuk cookie CSRF", () => {
    const token = createCsrfToken();

    expect(token).toHaveLength(64);
    expect(isValidCsrfToken(token)).toBe(true);
  });

  it("membaca token valid dari cookie browser", () => {
    vi.stubGlobal("document", {
      cookie: `theme=dark; ${CSRF_COOKIE_NAME}=${TOKEN}`,
    });

    expect(getCsrfTokenFromCookie()).toBe(TOKEN);
  });

  it("menganggap GET, HEAD, dan OPTIONS sebagai method aman", () => {
    expect(isSafeCsrfMethod("GET")).toBe(true);
    expect(isSafeCsrfMethod("head")).toBe(true);
    expect(isSafeCsrfMethod("OPTIONS")).toBe(true);
    expect(isSafeCsrfMethod("POST")).toBe(false);
  });

  it("default cookie CSRF secure mengikuti NODE_ENV production", () => {
    delete process.env.CSRF_COOKIE_SECURE;
    process.env.NODE_ENV = "production";

    expect(shouldUseSecureCsrfCookie()).toBe(true);
  });

  it("mengizinkan CSRF_COOKIE_SECURE=false untuk self-host HTTP", () => {
    process.env.NODE_ENV = "production";
    process.env.CSRF_COOKIE_SECURE = "false";

    expect(shouldUseSecureCsrfCookie()).toBe(false);
  });

  it("mengizinkan CSRF_COOKIE_SECURE=true di luar production", () => {
    process.env.NODE_ENV = "development";
    process.env.CSRF_COOKIE_SECURE = "true";

    expect(shouldUseSecureCsrfCookie()).toBe(true);
  });
});

describe("api client csrf header", () => {
  beforeEach(() => {
    vi.stubGlobal("document", {
      cookie: `${CSRF_COOKIE_NAME}=${TOKEN}`,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mengirim X-CSRF-Token untuk request unsafe", async () => {
    await apiPost("/api/example", { value: 1 });

    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get(CSRF_HEADER_NAME)).toBe(TOKEN);
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("tidak mengirim X-CSRF-Token untuk GET", async () => {
    await apiGet("/api/example");

    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get(CSRF_HEADER_NAME)).toBeNull();
  });

  it("mengirim X-CSRF-Token saat upload content memakai signed URL internal", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            id: "intent-1",
            status: "UPLOADED",
            sizeBytes: 1,
            checksumSha256: "b".repeat(64),
            etag: "etag-1",
          },
        }),
        { status: 200 }
      )
    );

    await uploadContentWithSignedUrl({
      uploadUrl: "/api/uploads/intents/intent-1/content?token=upload-token",
      fileType: "text/plain",
      data: new Uint8Array([1]),
    });

    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get(CSRF_HEADER_NAME)).toBe(TOKEN);
    expect(headers.get("content-type")).toBe("text/plain");
  });
});

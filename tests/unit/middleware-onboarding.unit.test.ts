import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf";
import { verifySessionToken } from "@/lib/server-auth";
import { ROLES } from "@/lib/constants";

vi.mock("@/lib/server-auth", () => ({
  SESSION_COOKIE_NAME: "schoolio_session",
  verifySessionToken: vi.fn(),
}));

describe("middleware onboarding gate", () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
  });

  afterAll(() => {
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = originalDemoMode;
    }
  });

  it("redirect ke onboarding jika user belum selesai onboarding saat akses dashboard", async () => {
    vi.mocked(verifySessionToken).mockResolvedValue({
      userId: "teacher-1",
      name: "Guru",
      role: ROLES.TEACHER,
      canUseDebugPanel: false,
      onboardingCompleted: false,
      mustChangePassword: false,
      issuedAt: 1,
      expiresAt: 9999999999,
    } as never);

    const request = new NextRequest("http://localhost/dashboard");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/onboarding");
  });

  it("redirect ke change-password jika session wajib ganti password", async () => {
    vi.mocked(verifySessionToken).mockResolvedValue({
      userId: "student-1",
      name: "Siswa",
      role: ROLES.STUDENT,
      canUseDebugPanel: false,
      onboardingCompleted: true,
      mustChangePassword: true,
      issuedAt: 1,
      expiresAt: 9999999999,
    } as never);

    const request = new NextRequest("http://localhost/dashboard");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/change-password");
  });

  it("menerbitkan cookie CSRF pada halaman auth", async () => {
    const request = new NextRequest("http://localhost/auth");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(CSRF_COOKIE_NAME);
  });

  it("menerbitkan cookie CSRF pada landing page", async () => {
    const request = new NextRequest("http://localhost/");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(CSRF_COOKIE_NAME);
  });

  it("redirect auth ke demo saat demo mode aktif", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "true";
    const request = new NextRequest("http://localhost/auth?from=/dashboard");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/demo?from=%2Fdashboard"
    );
  });

  it("menolak POST API tanpa pasangan cookie/header CSRF", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: "admin", password: "admin" }),
    });
    const response = await middleware(request);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(payload.error.message).toBe("Token CSRF tidak valid");
  });

  it("meneruskan POST API jika cookie dan header CSRF cocok", async () => {
    const token = "a".repeat(64);
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${CSRF_COOKIE_NAME}=${token}`,
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ identifier: "admin", password: "admin" }),
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("menolak POST API jika cookie dan header CSRF berbeda", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${CSRF_COOKIE_NAME}=${"a".repeat(64)}`,
        [CSRF_HEADER_NAME]: "b".repeat(64),
      },
      body: JSON.stringify({ identifier: "admin", password: "admin" }),
    });
    const response = await middleware(request);

    expect(response.status).toBe(403);
  });
});

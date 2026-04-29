import { POST as login } from "@/app/api/auth/login/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { RATE_LIMIT_POLICIES, resetRateLimitForTests } from "@/lib/rate-limit";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    authCredential: {
      findUnique: vi.fn(),
    },
    schoolProfile: {
      upsert: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
    },
    teacherProfile: {
      upsert: vi.fn(),
    },
    studentProfile: {
      upsert: vi.fn(),
    },
    parentProfile: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn(),
}));

describe("auth login route", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;

  beforeEach(() => {
    vi.resetAllMocks();
    resetRateLimitForTests();
    process.env.NODE_ENV = "test";
    delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = originalDemoMode;
    }
  });

  it("login credential database berhasil", async () => {
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue({
      passwordSalt: "salt",
      passwordHash: "hash",
      user: {
        id: "user-1",
        name: "Guru Baru",
        role: ROLES.TEACHER,
        onboardingCompletedAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "guru-baru",
        password: "password123",
      }),
    });

    const response = await login(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.user.id).toBe("user-1");
    expect(payload.data.onboardingCompleted).toBe(true);
  });

  it("login database gagal jika password salah", async () => {
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue({
      passwordSalt: "salt",
      passwordHash: "hash",
      user: {
        id: "user-2",
        name: "Siswa Baru",
        role: ROLES.STUDENT,
        onboardingCompletedAt: null,
      },
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "siswa-baru",
        password: "salah",
      }),
    });

    const response = await login(request as never);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("menolak login manual saat demo mode aktif", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "true";
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "admin",
        password: "admin",
      }),
    });

    const response = await login(request as never);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(prisma.authCredential.findUnique).not.toHaveBeenCalled();
  });

  it("membatasi percobaan login berulang untuk identifier dan IP yang sama", async () => {
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue(null as never);

    const buildRequest = () =>
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.20",
        },
        body: JSON.stringify({
          identifier: "target@example.com",
          password: "salah",
        }),
      });

    for (let index = 0; index < RATE_LIMIT_POLICIES.authLogin.limit; index += 1) {
      const response = await login(buildRequest() as never);
      expect(response.status).toBe(401);
    }

    const response = await login(buildRequest() as never);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error.code).toBe("RATE_LIMITED");
    expect(response.headers.get("Retry-After")).toBe("6");
    expect(prisma.authCredential.findUnique).toHaveBeenCalledTimes(
      RATE_LIMIT_POLICIES.authLogin.limit
    );
  });
});

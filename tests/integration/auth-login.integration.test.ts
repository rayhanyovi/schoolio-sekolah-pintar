import { POST as login } from "@/app/api/auth/login/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

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

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
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

  it("akun demo aktif di non-production", async () => {
    vi.mocked(prisma.schoolProfile.upsert).mockResolvedValue({
      id: "school-demo",
    } as never);
    vi.mocked(prisma.user.upsert).mockResolvedValue({
      id: "demo-admin",
    } as never);

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

    expect(response.status).toBe(200);
    expect(payload.data.user.role).toBe(ROLES.ADMIN);
    expect(payload.data.onboardingCompleted).toBe(true);
  });

  it("akun demo ditolak di production", async () => {
    process.env.NODE_ENV = "production";
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue(null as never);

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

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });
});

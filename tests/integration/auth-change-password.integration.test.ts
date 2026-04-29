import { POST as changePassword } from "@/app/api/auth/change-password/route";
import { requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSessionToken } from "@/lib/server-auth";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    authCredential: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/server-auth", () => ({
  createSessionToken: vi.fn(),
  SESSION_COOKIE_NAME: "schoolio_session",
  sessionCookieOptions: {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 8,
  },
}));

const buildTransactionMock = () => ({
  authCredential: {
    update: vi.fn(),
  },
  passwordResetToken: {
    updateMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
});

describe("auth change password route", () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "user-1",
      name: "Siswa",
      role: ROLES.STUDENT,
      canUseDebugPanel: false,
      onboardingCompleted: true,
      issuedAt: 1,
      expiresAt: 2,
      schoolId: "school-1",
      isDemo: false,
      demoInstanceId: null,
    } as never);
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue({
      id: "credential-1",
      passwordSalt: "old-salt",
      passwordHash: "old-hash",
      mustChangePassword: true,
      isDefaultPassword: true,
      user: {
        id: "user-1",
        name: "Siswa",
        role: ROLES.STUDENT,
        schoolId: "school-1",
        onboardingCompletedAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    } as never);
    vi.mocked(verifyPassword)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    vi.mocked(hashPassword).mockResolvedValue({
      passwordHash: "new-hash",
      passwordSalt: "new-salt",
    });
    vi.mocked(createSessionToken).mockResolvedValue("session-token");
  });

  afterAll(() => {
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = originalDemoMode;
    }
  });

  it("mengganti password dan menginvalidasi token reset aktif", async () => {
    const tx = buildTransactionMock();
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const response = await changePassword(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: "password-lama",
          newPassword: "password-baru",
          confirmPassword: "password-baru",
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.success).toBe(true);
    expect(tx.authCredential.update).toHaveBeenCalledWith({
      where: { id: "credential-1" },
      data: {
        passwordHash: "new-hash",
        passwordSalt: "new-salt",
        mustChangePassword: false,
        isDefaultPassword: false,
      },
    });
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        credentialId: "credential-1",
        usedAt: null,
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "user-1",
        actorRole: ROLES.STUDENT,
        action: "AUTH_PASSWORD_CHANGED",
        entityType: "User",
        entityId: "user-1",
        metadata: { credentialId: "credential-1" },
      }),
    });
  });

  it("tidak menginvalidasi token jika password saat ini salah", async () => {
    vi.mocked(verifyPassword).mockReset();
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const response = await changePassword(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: "salah",
          newPassword: "password-baru",
          confirmPassword: "password-baru",
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("menolak ganti password untuk session demo", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "true";
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "user-demo",
      name: "Demo",
      role: ROLES.STUDENT,
      canUseDebugPanel: false,
      onboardingCompleted: true,
      issuedAt: 1,
      expiresAt: 2,
      schoolId: "school-demo",
      isDemo: true,
      demoInstanceId: "demo-1",
    } as never);

    const response = await changePassword(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: "password-lama",
          newPassword: "password-baru",
          confirmPassword: "password-baru",
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(prisma.authCredential.findUnique).not.toHaveBeenCalled();
  });
});

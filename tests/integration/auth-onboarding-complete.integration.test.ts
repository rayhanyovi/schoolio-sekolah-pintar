import { POST as completeOnboarding } from "@/app/api/auth/onboarding/complete/route";
import { requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    schoolProfile: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

describe("auth onboarding complete route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireRole).mockReturnValue(null);
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "admin-1",
      name: "Admin",
      role: ROLES.ADMIN,
      canUseDebugPanel: false,
      onboardingCompleted: false,
      issuedAt: 1,
      expiresAt: 2,
      schoolId: "school-1",
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      roleSelectedAt: new Date("2026-03-05T00:00:00.000Z"),
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "admin-1",
      name: "Admin",
      role: ROLES.ADMIN,
      schoolId: "school-1",
    } as never);
  });

  it("admin dapat menyelesaikan onboarding walau setup opsional belum ada", async () => {
    vi.mocked(prisma.schoolProfile.findUnique).mockResolvedValue({
      id: "school-1",
      schoolCode: "SCH-DEMO01",
      name: "SMA 1",
      address: "Jl. A",
      email: "info@demo.sch.id",
    } as never);

    const response = await completeOnboarding(
      new Request("http://localhost/api/auth/onboarding/complete", {
        method: "POST",
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.success).toBe(true);
    expect(payload.data.redirectTo).toBe("/dashboard");
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it("admin ditolak jika profil sekolah wajib belum diisi", async () => {
    vi.mocked(prisma.schoolProfile.findUnique).mockResolvedValue(null as never);

    const response = await completeOnboarding(
      new Request("http://localhost/api/auth/onboarding/complete", {
        method: "POST",
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

import { NextRequest } from "next/server";

import { POST as submitWaitlist } from "@/app/api/waitlist/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { resetRateLimitForTests } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/server-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    waitlistEntry: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/server-auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

const buildRequest = (body: unknown, headers?: HeadersInit) =>
  new NextRequest("http://localhost/api/waitlist", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  });

describe("waitlist route", () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;

  beforeEach(() => {
    vi.resetAllMocks();
    resetRateLimitForTests();
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "true";
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);
    vi.mocked(prisma.waitlistEntry.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.waitlistEntry.create).mockResolvedValue({ id: "wl-1" } as never);
    vi.mocked(prisma.waitlistEntry.update).mockResolvedValue({ id: "wl-1" } as never);
  });

  afterAll(() => {
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = originalDemoMode;
    }
  });

  it("menolak saat demo mode mati", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "false";

    const response = await submitWaitlist(
      buildRequest({
        email: "school@email.sch.id",
        source: "landing_demo",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(prisma.waitlistEntry.findUnique).not.toHaveBeenCalled();
  });

  it("menolak email tidak valid", async () => {
    const response = await submitWaitlist(
      buildRequest({
        email: "not-an-email",
        source: "landing_demo",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(prisma.waitlistEntry.findUnique).not.toHaveBeenCalled();
  });

  it("membuat entry waitlist baru", async () => {
    const response = await submitWaitlist(
      buildRequest({
        email: "  School@Email.SCH.ID  ",
        source: "landing_demo",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("joined");
    expect(prisma.waitlistEntry.findUnique).toHaveBeenCalledWith({
      where: { emailNormalized: "school@email.sch.id" },
      select: { id: true },
    });
    expect(prisma.waitlistEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "School@Email.SCH.ID",
        emailNormalized: "school@email.sch.id",
        firstSource: "landing_demo",
        lastSource: "landing_demo",
      }),
    });
  });

  it("menganggap email duplikat sebagai sukses idempotent", async () => {
    vi.mocked(prisma.waitlistEntry.findUnique).mockResolvedValue({
      id: "wl-existing",
    } as never);

    const response = await submitWaitlist(
      buildRequest({
        email: "school@email.sch.id",
        source: "dashboard_demo_ribbon",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("already_joined");
    expect(prisma.waitlistEntry.create).not.toHaveBeenCalled();
    expect(prisma.waitlistEntry.update).toHaveBeenCalledWith({
      where: { emailNormalized: "school@email.sch.id" },
      data: expect.objectContaining({
        lastSource: "dashboard_demo_ribbon",
        submittedCount: { increment: 1 },
      }),
    });
  });

  it("menyimpan metadata session saat user demo sudah authenticated", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      userId: "teacher-1",
      name: "Guru Demo",
      role: ROLES.TEACHER,
      canUseDebugPanel: false,
      onboardingCompleted: true,
      schoolId: "school-demo-1",
      mustChangePassword: false,
      isDemo: true,
      demoInstanceId: "demo-instance-1",
      issuedAt: 1,
      expiresAt: 2,
    });

    const response = await submitWaitlist(
      buildRequest({
        email: "teacher@school.sch.id",
        source: "dashboard_demo_ribbon",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("joined");
    expect(prisma.waitlistEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "teacher-1",
        schoolId: "school-demo-1",
        role: ROLES.TEACHER,
        demoInstanceId: "demo-instance-1",
      }),
    });
  });
});

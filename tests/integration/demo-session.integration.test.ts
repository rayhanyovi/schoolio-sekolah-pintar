import { NextRequest } from "next/server";
import { POST as createDemoSession } from "@/app/api/demo/session/route";
import { getOrCreateDemoInstance } from "@/lib/demo-sandbox";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/server-auth";
import { DEMO_INSTANCE_COOKIE_NAME } from "@/lib/demo-mode";
import { ROLES } from "@/lib/constants";

vi.mock("@/lib/demo-sandbox", () => ({
  getOrCreateDemoInstance: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
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

describe("demo session route", () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "true";
    vi.mocked(getOrCreateDemoInstance).mockResolvedValue({
      id: "demo-instance-1",
      schoolId: "school-demo-1",
      templateSchoolId: "school-template-1",
      adminUserId: "admin-1",
      teacherUserId: "teacher-1",
      studentUserId: "student-1",
      parentUserId: "parent-1",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      lastAccessedAt: new Date(),
      createdAt: new Date(),
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "teacher-1",
      name: "Guru Demo",
      role: ROLES.TEACHER,
      schoolId: "school-demo-1",
      onboardingCompletedAt: new Date("2026-03-01T00:00:00.000Z"),
    } as never);
    vi.mocked(createSessionToken).mockResolvedValue("signed-session-token");
  });

  afterAll(() => {
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = originalDemoMode;
    }
  });

  it("membuat session demo dan menyetel cookie sandbox", async () => {
    const request = new NextRequest("http://localhost/api/demo/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${DEMO_INSTANCE_COOKIE_NAME}=demo-instance-1`,
      },
      body: JSON.stringify({ role: "TEACHER" }),
    });

    const response = await createDemoSession(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.isDemo).toBe(true);
    expect(payload.data.demoInstanceId).toBe("demo-instance-1");
    expect(payload.data.user.id).toBe("teacher-1");
    expect(getOrCreateDemoInstance).toHaveBeenCalledWith("demo-instance-1");
    expect(createSessionToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "teacher-1",
        schoolId: "school-demo-1",
        isDemo: true,
        demoInstanceId: "demo-instance-1",
      }),
    );
    expect(response.headers.get("set-cookie")).toContain("schoolio_session");
    expect(response.headers.get("set-cookie")).toContain(
      DEMO_INSTANCE_COOKIE_NAME,
    );
  });

  it("menolak saat demo mode mati", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "false";
    const request = new NextRequest("http://localhost/api/demo/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "TEACHER" }),
    });

    const response = await createDemoSession(request);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(getOrCreateDemoInstance).not.toHaveBeenCalled();
  });
});


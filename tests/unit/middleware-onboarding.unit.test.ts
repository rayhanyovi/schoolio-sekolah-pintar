import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { verifySessionToken } from "@/lib/server-auth";
import { ROLES } from "@/lib/constants";

vi.mock("@/lib/server-auth", () => ({
  SESSION_COOKIE_NAME: "schoolio_session",
  verifySessionToken: vi.fn(),
}));

describe("middleware onboarding gate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
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
});

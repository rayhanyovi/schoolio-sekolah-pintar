import { GET as getSession } from "@/app/api/auth/session/route";
import { requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

describe("auth session route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("mengembalikan onboardingCompleted dari session", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "student-1",
      name: "Siswa",
      role: ROLES.STUDENT,
      canUseDebugPanel: false,
      onboardingCompleted: false,
      issuedAt: 1,
      expiresAt: 2,
      schoolId: null,
    } as never);

    const response = await getSession(
      new Request("http://localhost/api/auth/session") as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.onboardingCompleted).toBe(false);
    expect(payload.data.schoolId).toBeNull();
  });
});

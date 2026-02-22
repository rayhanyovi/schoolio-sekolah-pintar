import { GET as getGovernanceReadiness } from "@/app/api/governance/readiness/route";
import { ROLES } from "@/lib/constants";
import { requireAuth } from "@/lib/api";
import { loadGovernanceReadinessSnapshot } from "@/lib/governance-readiness";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

vi.mock("@/lib/governance-readiness", () => ({
  loadGovernanceReadinessSnapshot: vi.fn(),
}));

describe("Governance readiness endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menolak akses non-admin", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedLoader = vi.mocked(loadGovernanceReadinessSnapshot);

    mockedRequireAuth.mockResolvedValue({
      userId: "teacher-1",
      role: ROLES.TEACHER,
      schoolId: null,
    } as never);

    const response = await getGovernanceReadiness(
      new Request("http://localhost/api/governance/readiness") as never
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(mockedLoader).not.toHaveBeenCalled();
  });

  it("mengembalikan snapshot readiness untuk admin", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedLoader = vi.mocked(loadGovernanceReadinessSnapshot);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedLoader.mockResolvedValue({
      generatedAt: "2026-02-22T00:00:00.000Z",
      overallReady: false,
      rel001: { ready: false, blockers: ["TP-AUTHZ-001"] },
      rel005: { ready: false, blockers: ["QA Lead"] },
      decisionGate: { ready: false, blockers: ["TP-DEC-001"] },
    });

    const response = await getGovernanceReadiness(
      new Request("http://localhost/api/governance/readiness") as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.overallReady).toBe(false);
    expect(payload.data.rel001.blockers).toContain("TP-AUTHZ-001");
    expect(mockedLoader).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan 500 saat loader gagal", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedLoader = vi.mocked(loadGovernanceReadinessSnapshot);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedLoader.mockRejectedValue(new Error("File missing"));

    const response = await getGovernanceReadiness(
      new Request("http://localhost/api/governance/readiness") as never
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("CONFLICT");
    expect(String(payload.error.message)).toContain("File missing");
  });
});

import { GET as getGovernanceTracker } from "@/app/api/governance/tracker/route";
import { ROLES } from "@/lib/constants";
import { requireAuth } from "@/lib/api";
import { loadGovernanceTrackerSnapshot } from "@/lib/governance-tracker";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

vi.mock("@/lib/governance-tracker", () => ({
  loadGovernanceTrackerSnapshot: vi.fn(),
}));

describe("Governance tracker endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menolak akses non-admin", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedLoader = vi.mocked(loadGovernanceTrackerSnapshot);

    mockedRequireAuth.mockResolvedValue({
      userId: "teacher-1",
      role: ROLES.TEACHER,
      schoolId: null,
    } as never);

    const response = await getGovernanceTracker(
      new Request("http://localhost/api/governance/tracker") as never
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(mockedLoader).not.toHaveBeenCalled();
  });

  it("mengembalikan snapshot tracker untuk admin", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedLoader = vi.mocked(loadGovernanceTrackerSnapshot);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedLoader.mockResolvedValue({
      generatedAt: "2026-03-02T00:00:00.000Z",
      totals: { total: 12, approved: 2, pending: 10, overdue: 1 },
      tasks: [],
      overdueTasks: [],
      pendingByPic: [{ pic: "Product Lead", pending: 2, overdue: 0, targets: [] }],
      recentHistory: [],
    } as never);

    const response = await getGovernanceTracker(
      new Request("http://localhost/api/governance/tracker") as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.totals.pending).toBe(10);
    expect(payload.data.pendingByPic[0].pic).toBe("Product Lead");
    expect(mockedLoader).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan 500 saat loader gagal", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedLoader = vi.mocked(loadGovernanceTrackerSnapshot);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedLoader.mockRejectedValue(new Error("Tracker file missing"));

    const response = await getGovernanceTracker(
      new Request("http://localhost/api/governance/tracker") as never
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("CONFLICT");
    expect(String(payload.error.message)).toContain("Tracker file missing");
  });
});

import { GET as getMetrics } from "@/app/api/metrics/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    uploadScanJob: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    $queryRaw: vi.fn(),
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

describe("GET /api/metrics upload scan queue", () => {
  const thresholdEnvKeys = [
    "UPLOAD_SCAN_ALERT_FAILED_THRESHOLD",
    "UPLOAD_SCAN_ALERT_INFECTED_THRESHOLD",
    "UPLOAD_SCAN_ALERT_PENDING_THRESHOLD",
    "UPLOAD_SCAN_ALERT_PENDING_AGE_MINUTES_THRESHOLD",
  ] as const;

  beforeEach(() => {
    vi.resetAllMocks();
    for (const key of thresholdEnvKeys) {
      delete process.env[key];
    }
  });

  it("mengembalikan metrik queue upload scan", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedQueryRaw = vi.mocked(prisma.$queryRaw);
    const mockedCount = vi.mocked(prisma.uploadScanJob.count);
    const mockedFindFirst = vi.mocked(prisma.uploadScanJob.findFirst);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }] as never);
    mockedCount
      .mockResolvedValueOnce(10 as never)
      .mockResolvedValueOnce(4 as never)
      .mockResolvedValueOnce(2 as never)
      .mockResolvedValueOnce(1 as never)
      .mockResolvedValueOnce(3 as never);
    mockedFindFirst.mockResolvedValue({
      queuedAt: new Date(Date.now() - 2 * 60 * 1000),
    } as never);

    const response = await getMetrics(
      new Request("http://localhost/api/metrics", { method: "GET" }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("ok");
    expect(payload.data.uploadScanQueue.totalJobs).toBe(10);
    expect(payload.data.uploadScanQueue.pendingJobs).toBe(4);
    expect(payload.data.uploadScanQueue.failedJobs).toBe(2);
    expect(payload.data.uploadScanQueue.infectedJobs).toBe(1);
    expect(payload.data.uploadScanQueue.cleanJobs).toBe(3);
    expect(payload.data.uploadScanQueue.alertState).toBe("CRITICAL");
    expect(payload.data.uploadScanQueue.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INFECTED_JOBS_THRESHOLD" }),
      ])
    );
    expect(payload.data.uploadScanQueue.oldestPendingMinutes).toBeGreaterThanOrEqual(
      2
    );
  });

  it("mengembalikan oldestPendingMinutes null jika tidak ada pending job", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedQueryRaw = vi.mocked(prisma.$queryRaw);
    const mockedCount = vi.mocked(prisma.uploadScanJob.count);
    const mockedFindFirst = vi.mocked(prisma.uploadScanJob.findFirst);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }] as never);
    mockedCount
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(1 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(2 as never);
    mockedFindFirst.mockResolvedValue(null as never);

    const response = await getMetrics(
      new Request("http://localhost/api/metrics", { method: "GET" }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.uploadScanQueue.pendingJobs).toBe(0);
    expect(payload.data.uploadScanQueue.oldestPendingMinutes).toBeNull();
    expect(payload.data.uploadScanQueue.alertState).toBe("NORMAL");
    expect(payload.data.uploadScanQueue.alerts).toEqual([]);
  });

  it("menggunakan threshold env untuk memicu escalation warning", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedQueryRaw = vi.mocked(prisma.$queryRaw);
    const mockedCount = vi.mocked(prisma.uploadScanJob.count);
    const mockedFindFirst = vi.mocked(prisma.uploadScanJob.findFirst);

    process.env.UPLOAD_SCAN_ALERT_FAILED_THRESHOLD = "1";
    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }] as never);
    mockedCount
      .mockResolvedValueOnce(2 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(1 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(1 as never);
    mockedFindFirst.mockResolvedValue(null as never);

    const response = await getMetrics(
      new Request("http://localhost/api/metrics", { method: "GET" }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.uploadScanQueue.alertState).toBe("WARNING");
    expect(payload.data.uploadScanQueue.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "FAILED_JOBS_THRESHOLD",
          threshold: 1,
        }),
      ])
    );
  });
});

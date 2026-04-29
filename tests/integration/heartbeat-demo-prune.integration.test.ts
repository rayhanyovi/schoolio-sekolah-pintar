import { GET as heartbeat } from "@/app/api/internal/heartbeat/route";
import { pruneExpiredDemoInstances } from "@/lib/demo-sandbox";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/demo-sandbox", () => ({
  pruneExpiredDemoInstances: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    systemHeartbeat: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("heartbeat demo cleanup", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }] as never);
    vi.mocked(prisma.systemHeartbeat.create).mockResolvedValue({
      id: "heartbeat-1",
      source: "vercel-cron",
      triggeredAt: new Date("2026-04-29T00:00:00.000Z"),
    } as never);
    vi.mocked(prisma.systemHeartbeat.deleteMany).mockResolvedValue({
      count: 3,
    } as never);
    vi.mocked(pruneExpiredDemoInstances).mockResolvedValue({
      scannedCount: 2,
      deletedCount: 2,
    });
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("memanggil prune demo sandbox saat heartbeat sukses", async () => {
    const response = await heartbeat(
      new Request("http://localhost/api/internal/heartbeat", {
        headers: {
          authorization: "Bearer cron-secret",
          "x-vercel-cron": "1",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(pruneExpiredDemoInstances).toHaveBeenCalledWith(expect.any(Date));
    expect(payload.data.prunedCount).toBe(3);
    expect(payload.data.demoPrunedCount).toBe(2);
  });
});


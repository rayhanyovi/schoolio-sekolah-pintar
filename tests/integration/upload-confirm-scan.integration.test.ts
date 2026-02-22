import { POST as confirmUploadIntent } from "@/app/api/uploads/intents/[id]/confirm/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";
import { queueUploadScan } from "@/lib/upload-scan";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    uploadIntent: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/upload-scan", () => ({
  queueUploadScan: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

describe("POST /api/uploads/intents/[id]/confirm scan hook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menjalankan queue scan dan persist attachment final", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindIntent = vi.mocked(prisma.uploadIntent.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const mockedQueueScan = vi.mocked(queueUploadScan);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindIntent.mockResolvedValue({
      id: "intent-1",
      materialId: "material-1",
      material: {
        id: "material-1",
        teacherId: "teacher-1",
      },
      attachment: null,
      fileName: "laporan.pdf",
      fileType: "application/pdf",
      sizeBytes: 1024,
      checksumSha256: "a".repeat(64),
      uploadedSizeBytes: 1024,
      uploadedChecksumSha256: "a".repeat(64),
      storageKey: "materials/material-1/intent-1/laporan.pdf",
      status: "UPLOADED",
      scanStatus: "PENDING",
      scanResult: null,
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    } as never);

    const tx = {
      materialAttachment: {
        upsert: vi.fn().mockResolvedValue({
          id: "attachment-1",
          materialId: "material-1",
          fileName: "laporan.pdf",
          fileType: "application/pdf",
          sizeLabel: "1.0 KB",
          url: null,
          storageKey: "materials/material-1/intent-1/laporan.pdf",
          checksumSha256: "a".repeat(64),
          etag: "a".repeat(64),
          scanStatus: "PENDING",
          uploadIntentId: "intent-1",
          createdAt: new Date("2026-02-22T00:00:00.000Z"),
        }),
        update: vi.fn().mockResolvedValue({
          id: "attachment-1",
        }),
      },
      uploadIntent: {
        update: vi.fn().mockResolvedValue({
          id: "intent-1",
          status: "CONFIRMED",
          scanStatus: "PENDING",
          scanResult: "Scan queued",
        }),
      },
    };
    mockedQueueScan.mockResolvedValue({
      id: "scan-1",
      intentId: "intent-1",
      status: "PENDING",
      result: "Scan queued",
    } as never);
    mockedTransaction.mockImplementation(async (callback: never) =>
      callback(tx as never)
    );

    const request = new Request(
      "http://localhost/api/uploads/intents/intent-1/confirm",
      {
        method: "POST",
      }
    );
    const response = await confirmUploadIntent(request as never, {
      params: { id: "intent-1" },
    } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("CONFIRMED");
    expect(payload.data.attachment.id).toBe("attachment-1");
    expect(mockedQueueScan).toHaveBeenCalledTimes(1);
  });
});

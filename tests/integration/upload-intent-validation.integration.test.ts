import { POST as createUploadIntent } from "@/app/api/uploads/intents/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    material: {
      findUnique: vi.fn(),
    },
    uploadIntent: {
      create: vi.fn(),
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

describe("POST /api/uploads/intents validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menolak fileType yang tidak diizinkan", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);

    const request = new Request("http://localhost/api/uploads/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        materialId: "material-1",
        fileName: "danger.exe",
        fileType: "application/x-msdownload",
        sizeBytes: 1024,
        checksumSha256: "a".repeat(64),
      }),
    });
    const response = await createUploadIntent(request as never);

    expect(response.status).toBe(400);
  });

  it("membuat upload intent valid dengan signed upload URL", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindMaterial = vi.mocked(prisma.material.findUnique);
    const mockedCreateIntent = vi.mocked(prisma.uploadIntent.create);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindMaterial.mockResolvedValue({
      id: "material-1",
      teacherId: "teacher-1",
    } as never);
    mockedCreateIntent.mockResolvedValue({
      id: "intent-1",
      materialId: "material-1",
      fileName: "laporan.pdf",
      fileType: "application/pdf",
      sizeBytes: 2048,
      checksumSha256: "b".repeat(64),
      storageKey: "materials/material-1/intent-1/laporan.pdf",
      status: "PENDING",
      expiresAt: new Date("2026-02-22T15:00:00.000Z"),
      createdAt: new Date("2026-02-22T14:45:00.000Z"),
    } as never);

    const request = new Request("http://localhost/api/uploads/intents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        materialId: "material-1",
        fileName: "laporan.pdf",
        fileType: "application/pdf",
        sizeBytes: 2048,
        checksumSha256: "b".repeat(64),
      }),
    });
    const response = await createUploadIntent(request as never);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.uploadUrl).toContain("/api/uploads/intents/");
    expect(payload.data.method).toBe("PUT");
    expect(mockedCreateIntent).toHaveBeenCalledTimes(1);
  });
});

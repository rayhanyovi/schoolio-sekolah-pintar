import { createHash } from "node:crypto";
import { PUT as uploadContent } from "@/app/api/uploads/intents/[id]/content/route";
import { prisma } from "@/lib/prisma";
import { putObject } from "@/lib/object-storage";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    uploadIntent: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/object-storage", async () => {
  const actual = await vi.importActual<typeof import("@/lib/object-storage")>(
    "@/lib/object-storage"
  );
  return {
    ...actual,
    putObject: vi.fn(),
  };
});

const hashToken = (value: string) =>
  createHash("sha256").update(value).digest("hex");

describe("PUT /api/uploads/intents/[id]/content integrity", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menolak payload dengan checksum tidak sesuai", async () => {
    const mockedFindIntent = vi.mocked(prisma.uploadIntent.findUnique);
    const mockedPutObject = vi.mocked(putObject);

    mockedFindIntent.mockResolvedValue({
      id: "intent-1",
      fileType: "text/plain",
      sizeBytes: 4,
      checksumSha256: "f".repeat(64),
      storageKey: "materials/material-1/intent-1/file.txt",
      uploadTokenHash: hashToken("valid-token"),
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      status: "PENDING",
    } as never);

    const request = new Request(
      "http://localhost/api/uploads/intents/intent-1/content?token=valid-token",
      {
        method: "PUT",
        headers: { "content-type": "text/plain" },
        body: "ABCD",
      }
    );
    const response = await uploadContent(request as never, {
      params: { id: "intent-1" },
    } as never);

    expect(response.status).toBe(409);
    expect(mockedPutObject).not.toHaveBeenCalled();
  });

  it("menyimpan object saat size dan checksum valid", async () => {
    const mockedFindIntent = vi.mocked(prisma.uploadIntent.findUnique);
    const mockedUpdateIntent = vi.mocked(prisma.uploadIntent.update);
    const mockedPutObject = vi.mocked(putObject);
    const payload = Buffer.from("ABCD");
    const checksum = createHash("sha256").update(payload).digest("hex");

    mockedFindIntent.mockResolvedValue({
      id: "intent-1",
      fileType: "text/plain",
      sizeBytes: payload.length,
      checksumSha256: checksum,
      storageKey: "materials/material-1/intent-1/file.txt",
      uploadTokenHash: hashToken("valid-token"),
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      status: "PENDING",
    } as never);
    mockedUpdateIntent.mockResolvedValue({ id: "intent-1" } as never);

    const request = new Request(
      "http://localhost/api/uploads/intents/intent-1/content?token=valid-token",
      {
        method: "PUT",
        headers: { "content-type": "text/plain" },
        body: payload,
      }
    );
    const response = await uploadContent(request as never, {
      params: { id: "intent-1" },
    } as never);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data.status).toBe("UPLOADED");
    expect(mockedPutObject).toHaveBeenCalledTimes(1);
    expect(mockedUpdateIntent).toHaveBeenCalledTimes(1);
  });
});

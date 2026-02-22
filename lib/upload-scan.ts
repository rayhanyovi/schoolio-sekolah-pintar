import {
  PrismaClient,
  Prisma,
  UploadScanStatus,
} from "@prisma/client";

type DbLike = PrismaClient | Prisma.TransactionClient;

type QueueUploadScanInput = {
  intentId: string;
  provider?: string;
};

const parseMockScanResult = (): UploadScanStatus | null => {
  const raw = (process.env.UPLOAD_SCAN_MOCK_RESULT ?? "").trim().toUpperCase();
  if (!raw) return null;
  if (raw === "CLEAN" || raw === "INFECTED" || raw === "FAILED") {
    return raw as UploadScanStatus;
  }
  return null;
};

export const queueUploadScan = async (
  db: DbLike,
  input: QueueUploadScanInput
) => {
  const provider = input.provider ?? "NOOP";
  const queued = await db.uploadScanJob.upsert({
    where: { intentId: input.intentId },
    update: {
      status: "PENDING",
      provider,
      result: "Scan queued",
      queuedAt: new Date(),
      completedAt: null,
    },
    create: {
      intentId: input.intentId,
      status: "PENDING",
      provider,
      result: "Scan queued",
    },
  });

  const mockResult = parseMockScanResult();
  if (!mockResult) {
    return queued;
  }

  const completed = await db.uploadScanJob.update({
    where: { intentId: input.intentId },
    data: {
      status: mockResult,
      result: `Scan simulated as ${mockResult}`,
      completedAt: new Date(),
    },
  });
  await db.uploadIntent.update({
    where: { id: input.intentId },
    data: {
      scanStatus: mockResult,
      scanResult: completed.result ?? null,
    },
  });
  return completed;
};

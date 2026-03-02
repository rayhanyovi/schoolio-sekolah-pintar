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

export type UploadScanQueueAlertLevel = "WARNING" | "CRITICAL";

export type UploadScanQueueAlert = {
  code: string;
  level: UploadScanQueueAlertLevel;
  message: string;
  value: number;
  threshold: number;
};

export type UploadScanQueueAlertState = "NORMAL" | "WARNING" | "CRITICAL";

export type UploadScanQueueMetrics = {
  totalJobs: number;
  pendingJobs: number;
  failedJobs: number;
  infectedJobs: number;
  cleanJobs: number;
  oldestPendingMinutes: number | null;
  alertState: UploadScanQueueAlertState;
  alerts: UploadScanQueueAlert[];
};

const DEFAULT_ALERT_FAILED_THRESHOLD = 3;
const DEFAULT_ALERT_INFECTED_THRESHOLD = 1;
const DEFAULT_ALERT_PENDING_THRESHOLD = 20;
const DEFAULT_ALERT_PENDING_AGE_MINUTES_THRESHOLD = 30;

const parseMockScanResult = (): UploadScanStatus | null => {
  const raw = (process.env.UPLOAD_SCAN_MOCK_RESULT ?? "").trim().toUpperCase();
  if (!raw) return null;
  if (raw === "CLEAN" || raw === "INFECTED" || raw === "FAILED") {
    return raw as UploadScanStatus;
  }
  return null;
};

const parseThreshold = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const getAlertThresholds = () => ({
  failedJobs: parseThreshold(
    process.env.UPLOAD_SCAN_ALERT_FAILED_THRESHOLD,
    DEFAULT_ALERT_FAILED_THRESHOLD
  ),
  infectedJobs: parseThreshold(
    process.env.UPLOAD_SCAN_ALERT_INFECTED_THRESHOLD,
    DEFAULT_ALERT_INFECTED_THRESHOLD
  ),
  pendingJobs: parseThreshold(
    process.env.UPLOAD_SCAN_ALERT_PENDING_THRESHOLD,
    DEFAULT_ALERT_PENDING_THRESHOLD
  ),
  pendingAgeMinutes: parseThreshold(
    process.env.UPLOAD_SCAN_ALERT_PENDING_AGE_MINUTES_THRESHOLD,
    DEFAULT_ALERT_PENDING_AGE_MINUTES_THRESHOLD
  ),
});

const computeAlertState = (
  alerts: UploadScanQueueAlert[]
): UploadScanQueueAlertState => {
  if (alerts.some((alert) => alert.level === "CRITICAL")) {
    return "CRITICAL";
  }
  if (alerts.some((alert) => alert.level === "WARNING")) {
    return "WARNING";
  }
  return "NORMAL";
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

export const getUploadScanQueueMetrics = async (
  db: DbLike
): Promise<UploadScanQueueMetrics> => {
  const thresholds = getAlertThresholds();
  const [
    totalJobs,
    pendingJobs,
    failedJobs,
    infectedJobs,
    cleanJobs,
    oldestPending,
  ] = await Promise.all([
    db.uploadScanJob.count(),
    db.uploadScanJob.count({
      where: { status: "PENDING" },
    }),
    db.uploadScanJob.count({
      where: { status: "FAILED" },
    }),
    db.uploadScanJob.count({
      where: { status: "INFECTED" },
    }),
    db.uploadScanJob.count({
      where: { status: "CLEAN" },
    }),
    db.uploadScanJob.findFirst({
      where: { status: "PENDING" },
      orderBy: { queuedAt: "asc" },
      select: { queuedAt: true },
    }),
  ]);

  const oldestPendingMinutes = oldestPending
    ? Math.max(
        0,
        Math.floor((Date.now() - oldestPending.queuedAt.getTime()) / 60000)
      )
    : null;

  const alerts: UploadScanQueueAlert[] = [];
  if (failedJobs >= thresholds.failedJobs) {
    alerts.push({
      code: "FAILED_JOBS_THRESHOLD",
      level: "WARNING",
      message: `Jumlah scan FAILED (${failedJobs}) melewati threshold (${thresholds.failedJobs})`,
      value: failedJobs,
      threshold: thresholds.failedJobs,
    });
  }
  if (infectedJobs >= thresholds.infectedJobs) {
    alerts.push({
      code: "INFECTED_JOBS_THRESHOLD",
      level: "CRITICAL",
      message: `Jumlah scan INFECTED (${infectedJobs}) melewati threshold (${thresholds.infectedJobs})`,
      value: infectedJobs,
      threshold: thresholds.infectedJobs,
    });
  }
  if (pendingJobs >= thresholds.pendingJobs) {
    alerts.push({
      code: "PENDING_JOBS_THRESHOLD",
      level: "WARNING",
      message: `Jumlah scan PENDING (${pendingJobs}) melewati threshold (${thresholds.pendingJobs})`,
      value: pendingJobs,
      threshold: thresholds.pendingJobs,
    });
  }
  if (
    oldestPendingMinutes !== null &&
    oldestPendingMinutes >= thresholds.pendingAgeMinutes
  ) {
    alerts.push({
      code: "PENDING_AGE_THRESHOLD",
      level: "WARNING",
      message: `Usia pending terlama (${oldestPendingMinutes} menit) melewati threshold (${thresholds.pendingAgeMinutes} menit)`,
      value: oldestPendingMinutes,
      threshold: thresholds.pendingAgeMinutes,
    });
  }

  const alertState = computeAlertState(alerts);

  return {
    totalJobs,
    pendingJobs,
    failedJobs,
    infectedJobs,
    cleanJobs,
    oldestPendingMinutes,
    alertState,
    alerts,
  };
};

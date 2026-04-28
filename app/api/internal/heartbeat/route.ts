import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "node:crypto";

const DEFAULT_RETENTION_DAYS = 180;
const DEFAULT_SOURCE = "vercel-cron";

const getBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization")?.trim();
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

const safeCompare = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
};

const parseRetentionDays = () => {
  const raw = process.env.HEARTBEAT_RETENTION_DAYS?.trim();
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RETENTION_DAYS;
  return Math.floor(parsed);
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("[heartbeat] CRON_SECRET is not configured");
    return jsonError("CONFIGURATION_ERROR", "Cron secret is not configured", 500);
  }

  const token = getBearerToken(request);
  if (!token) {
    return jsonError("UNAUTHORIZED", "Missing cron authorization", 401);
  }

  if (!safeCompare(token, secret)) {
    return jsonError("FORBIDDEN", "Invalid cron authorization", 403);
  }

  const triggeredAt = new Date();
  const retentionDays = parseRetentionDays();
  const cutoff = new Date(
    triggeredAt.getTime() - retentionDays * 24 * 60 * 60 * 1000,
  );
  const source =
    request.headers.get("x-vercel-cron")?.trim() || DEFAULT_SOURCE;
  const note = request.headers.get("user-agent")?.includes("vercel")
    ? "Triggered by Vercel Cron"
    : "Triggered by authorized heartbeat client";

  try {
    await prisma.$queryRaw`SELECT 1`;

    const heartbeat = await prisma.systemHeartbeat.create({
      data: {
        source,
        triggeredAt,
        status: "OK",
        note,
        metadata: {
          userAgent: request.headers.get("user-agent"),
          vercelId: request.headers.get("x-vercel-id"),
          vercelCron: request.headers.get("x-vercel-cron"),
        },
      },
      select: {
        id: true,
        source: true,
        triggeredAt: true,
      },
    });

    const pruneResult = await prisma.systemHeartbeat.deleteMany({
      where: {
        triggeredAt: {
          lt: cutoff,
        },
      },
    });

    return jsonOk({
      ok: true,
      id: heartbeat.id,
      source: heartbeat.source,
      triggeredAt: heartbeat.triggeredAt.toISOString(),
      prunedCount: pruneResult.count,
    });
  } catch (error) {
    console.error("[heartbeat] failed", error);
    return jsonError("CONFLICT", "Heartbeat write failed", 500);
  }
}

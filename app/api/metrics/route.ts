import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { getUploadScanQueueMetrics } from "@/lib/upload-scan";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  try {
    await prisma.$queryRaw`SELECT 1`;
    const uploadScanQueue = await getUploadScanQueueMetrics(prisma);
    if (uploadScanQueue.alertState !== "NORMAL") {
      const alertCodes = uploadScanQueue.alerts.map((alert) => alert.code).join(",");
      console.warn(
        `[upload-scan-alert] state=${uploadScanQueue.alertState} codes=${alertCodes}`
      );
    }
    return jsonOk({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: "up",
      uploadScanQueue,
    });
  } catch {
    return jsonError("CONFLICT", "Database health check failed", 503);
  }
}

import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { loadGovernanceReadinessSnapshot } from "@/lib/governance-readiness";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  try {
    const snapshot = await loadGovernanceReadinessSnapshot();
    return jsonOk(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(
      "CONFLICT",
      `Gagal memuat governance readiness snapshot: ${message}`,
      500
    );
  }
}

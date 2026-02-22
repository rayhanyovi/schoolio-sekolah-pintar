import { apiGet } from "@/lib/api-client";
import { governanceReadinessSnapshotSchema } from "@/lib/schemas";

export const getGovernanceReadiness = () =>
  apiGet("/api/governance/readiness").then((data) =>
    governanceReadinessSnapshotSchema.parse(data)
  );

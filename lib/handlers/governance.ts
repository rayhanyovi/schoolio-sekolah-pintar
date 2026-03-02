import { apiGet, apiPost } from "@/lib/api-client";
import {
  governanceApprovalMutationPayloadSchema,
  governanceApprovalMutationResultSchema,
  governanceReadinessSnapshotSchema,
  governanceTrackerSnapshotSchema,
  GovernanceApprovalMutationPayload,
} from "@/lib/schemas";

export const getGovernanceReadiness = () =>
  apiGet("/api/governance/readiness").then((data) =>
    governanceReadinessSnapshotSchema.parse(data)
  );

export const getGovernanceTracker = () =>
  apiGet("/api/governance/tracker").then((data) =>
    governanceTrackerSnapshotSchema.parse(data)
  );

export const updateGovernanceApproval = (
  payload: GovernanceApprovalMutationPayload
) =>
  apiPost("/api/governance/approvals", {
    ...governanceApprovalMutationPayloadSchema.parse(payload),
  }).then((data) => governanceApprovalMutationResultSchema.parse(data));

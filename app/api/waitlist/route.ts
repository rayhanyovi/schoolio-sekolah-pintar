import { NextRequest } from "next/server";

import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/server-auth";
import {
  normalizeWaitlistEmail,
  submitWaitlistEntry,
  waitlistSubmitSchema,
} from "@/lib/waitlist";

export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return jsonError("FORBIDDEN", "Demo waitlist is not available", 403);
  }

  const parsedBody = await parseJsonBody(request, waitlistSubmitSchema);
  if (parsedBody instanceof Response) return parsedBody;

  const emailNormalized = normalizeWaitlistEmail(parsedBody.email);
  const rateLimitError = enforceRateLimit(
    request,
    RATE_LIMIT_POLICIES.waitlistSubmit,
    emailNormalized,
  );
  if (rateLimitError) return rateLimitError;

  const session = await getSessionFromRequest(request);
  const result = await submitWaitlistEntry({
    email: parsedBody.email,
    source: parsedBody.source,
    session,
  });

  return jsonOk(result);
}

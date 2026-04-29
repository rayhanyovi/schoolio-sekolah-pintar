import { apiPost } from "@/lib/api-client";
import type { WaitlistSource, WaitlistSubmitStatus } from "@/lib/waitlist";

export type JoinWaitlistPayload = {
  email: string;
  source: WaitlistSource;
};

export type JoinWaitlistResult = {
  status: WaitlistSubmitStatus;
};

export const joinWaitlist = (payload: JoinWaitlistPayload) =>
  apiPost<JoinWaitlistResult>("/api/waitlist", payload);

import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return jsonError("UNAUTHORIZED", "Authentication required", 401);
  }
  return jsonOk(session);
}

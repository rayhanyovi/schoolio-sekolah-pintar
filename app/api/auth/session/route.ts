import { NextRequest } from "next/server";
import { jsonOk, requireAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) {
    return auth;
  }
  return jsonOk(auth);
}

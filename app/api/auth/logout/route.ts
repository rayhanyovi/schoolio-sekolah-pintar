import { jsonOk } from "@/lib/api";
import { sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/server-auth";

export async function POST() {
  const response = jsonOk({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}

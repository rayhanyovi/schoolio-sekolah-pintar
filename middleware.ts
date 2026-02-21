import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const shouldProtectRoute = isDashboardRoute;

  if (!shouldProtectRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await verifySessionToken(token);
  if (session) {
    return NextResponse.next();
  }

  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

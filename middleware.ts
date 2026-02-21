import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server-auth";

const isPublicApiPath = (pathname: string) =>
  pathname === "/api/auth/login";

const buildUnauthorizedApiResponse = () =>
  NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    },
    { status: 401 }
  );

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");
  const isProtectedApiRoute = isApiRoute && !isPublicApiPath(pathname);
  const shouldProtectRoute = isDashboardRoute || isProtectedApiRoute;

  if (!shouldProtectRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await verifySessionToken(token);
  if (session) {
    return NextResponse.next();
  }

  if (isApiRoute) {
    return buildUnauthorizedApiResponse();
  }

  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

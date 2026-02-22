import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server-auth";

const isPublicApiPath = (pathname: string) =>
  pathname === "/api/auth/login";

const attachCorrelationId = (response: NextResponse, correlationId: string) => {
  response.headers.set("x-correlation-id", correlationId);
  return response;
};

const buildUnauthorizedApiResponse = (correlationId: string) =>
  attachCorrelationId(
    NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    },
    { status: 401 }
    ),
    correlationId
  );

const createForwardResponse = (
  request: NextRequest,
  correlationId: string
) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return attachCorrelationId(response, correlationId);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const correlationId =
    request.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");
  const isProtectedApiRoute = isApiRoute && !isPublicApiPath(pathname);
  const shouldProtectRoute = isDashboardRoute || isProtectedApiRoute;

  if (isApiRoute) {
    console.info(
      `[api-request] correlationId=${correlationId} ${request.method} ${pathname}`
    );
  }

  if (!shouldProtectRoute) {
    return createForwardResponse(request, correlationId);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await verifySessionToken(token);
  if (session) {
    return createForwardResponse(request, correlationId);
  }

  if (isApiRoute) {
    return buildUnauthorizedApiResponse(correlationId);
  }

  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("from", pathname);
  return attachCorrelationId(NextResponse.redirect(authUrl), correlationId);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

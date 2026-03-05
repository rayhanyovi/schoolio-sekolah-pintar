import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server-auth";

const isPublicApiPath = (pathname: string) =>
  pathname === "/api/auth/login" || pathname === "/api/auth/register";

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
  const isOnboardingRoute =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isApiRoute = pathname.startsWith("/api");
  const isProtectedApiRoute = isApiRoute && !isPublicApiPath(pathname);
  const shouldProtectRoute =
    isDashboardRoute || isOnboardingRoute || isProtectedApiRoute;

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
    if (isDashboardRoute && !session.onboardingCompleted) {
      const onboardingUrl = new URL("/onboarding", request.url);
      onboardingUrl.searchParams.set("from", pathname);
      return attachCorrelationId(
        NextResponse.redirect(onboardingUrl),
        correlationId
      );
    }
    if (isOnboardingRoute && session.onboardingCompleted) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return attachCorrelationId(
        NextResponse.redirect(dashboardUrl),
        correlationId
      );
    }
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
  matcher: ["/dashboard/:path*", "/onboarding", "/onboarding/:path*", "/api/:path*"],
};

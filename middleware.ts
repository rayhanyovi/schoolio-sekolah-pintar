import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server-auth";

const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

const MUST_CHANGE_PASSWORD_ALLOWED_API_PATHS = new Set([
  "/api/auth/change-password",
  "/api/auth/session",
  "/api/auth/logout",
]);

const isPublicApiPath = (pathname: string) => PUBLIC_API_PATHS.has(pathname);
const isMustChangePasswordAllowedApiPath = (pathname: string) =>
  MUST_CHANGE_PASSWORD_ALLOWED_API_PATHS.has(pathname);

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

const buildMustChangePasswordApiResponse = (correlationId: string) =>
  attachCorrelationId(
    NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Password harus diganti terlebih dahulu",
        },
      },
      { status: 403 }
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
  const isChangePasswordRoute =
    pathname === "/change-password" || pathname.startsWith("/change-password/");
  const isApiRoute = pathname.startsWith("/api");
  const isProtectedApiRoute = isApiRoute && !isPublicApiPath(pathname);
  const shouldProtectRoute =
    isDashboardRoute ||
    isOnboardingRoute ||
    isChangePasswordRoute ||
    isProtectedApiRoute;

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
    if (session.mustChangePassword) {
      if (isApiRoute && !isMustChangePasswordAllowedApiPath(pathname)) {
        return buildMustChangePasswordApiResponse(correlationId);
      }
      if (!isApiRoute && !isChangePasswordRoute) {
        const changePasswordUrl = new URL("/change-password", request.url);
        changePasswordUrl.searchParams.set("from", pathname);
        return attachCorrelationId(
          NextResponse.redirect(changePasswordUrl),
          correlationId
        );
      }
      return createForwardResponse(request, correlationId);
    }
    if (isChangePasswordRoute) {
      const destination = session.onboardingCompleted ? "/dashboard" : "/onboarding";
      const destinationUrl = new URL(destination, request.url);
      return attachCorrelationId(
        NextResponse.redirect(destinationUrl),
        correlationId
      );
    }
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
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/change-password",
    "/change-password/:path*",
    "/api/:path*",
  ],
};

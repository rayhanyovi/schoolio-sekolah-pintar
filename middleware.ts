import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateRequestCsrfToken,
  hasValidCsrfTokenPair,
  isSafeCsrfMethod,
  setCsrfCookie,
} from "@/lib/csrf";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server-auth";

const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/demo/session",
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

const finalizeResponse = (
  request: NextRequest,
  response: NextResponse,
  correlationId: string
) => {
  attachCorrelationId(response, correlationId);
  return setCsrfCookie(response, getOrCreateRequestCsrfToken(request));
};

const buildUnauthorizedApiResponse = (
  request: NextRequest,
  correlationId: string
) =>
  finalizeResponse(
    request,
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

const buildMustChangePasswordApiResponse = (
  request: NextRequest,
  correlationId: string
) =>
  finalizeResponse(
    request,
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

const buildCsrfApiResponse = (request: NextRequest, correlationId: string) =>
  finalizeResponse(
    request,
    NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Token CSRF tidak valid",
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
  return finalizeResponse(request, response, correlationId);
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
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");
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

  if (!isApiRoute && isDemoModeEnabled() && isAuthRoute) {
    const demoUrl = new URL("/demo", request.url);
    const from = request.nextUrl.searchParams.get("from");
    if (from) demoUrl.searchParams.set("from", from);
    return finalizeResponse(
      request,
      NextResponse.redirect(demoUrl),
      correlationId
    );
  }

  if (isApiRoute && !isSafeCsrfMethod(request.method)) {
    if (!hasValidCsrfTokenPair(request)) {
      return buildCsrfApiResponse(request, correlationId);
    }
  }

  if (!shouldProtectRoute) {
    return createForwardResponse(request, correlationId);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await verifySessionToken(token);
  if (session) {
    if (session.mustChangePassword) {
      if (isApiRoute && !isMustChangePasswordAllowedApiPath(pathname)) {
        return buildMustChangePasswordApiResponse(request, correlationId);
      }
      if (!isApiRoute && !isChangePasswordRoute) {
        const changePasswordUrl = new URL("/change-password", request.url);
        changePasswordUrl.searchParams.set("from", pathname);
        return finalizeResponse(
          request,
          NextResponse.redirect(changePasswordUrl),
          correlationId
        );
      }
      return createForwardResponse(request, correlationId);
    }
    if (isChangePasswordRoute) {
      const destination = session.onboardingCompleted
        ? "/dashboard"
        : "/onboarding";
      const destinationUrl = new URL(destination, request.url);
      return finalizeResponse(
        request,
        NextResponse.redirect(destinationUrl),
        correlationId
      );
    }
    if (isDashboardRoute && !session.onboardingCompleted) {
      const onboardingUrl = new URL("/onboarding", request.url);
      onboardingUrl.searchParams.set("from", pathname);
      return finalizeResponse(
        request,
        NextResponse.redirect(onboardingUrl),
        correlationId
      );
    }
    if (isOnboardingRoute && session.onboardingCompleted) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return finalizeResponse(
        request,
        NextResponse.redirect(dashboardUrl),
        correlationId
      );
    }
    return createForwardResponse(request, correlationId);
  }

  if (isApiRoute) {
    return buildUnauthorizedApiResponse(request, correlationId);
  }

  const authUrl = new URL(
    isDemoModeEnabled() ? "/demo" : "/auth",
    request.url
  );
  authUrl.searchParams.set("from", pathname);
  return finalizeResponse(
    request,
    NextResponse.redirect(authUrl),
    correlationId
  );
}

export const config = {
  matcher: [
    "/auth",
    "/auth/:path*",
    "/demo",
    "/demo/:path*",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/change-password",
    "/change-password/:path*",
    "/api/:path*",
  ],
};

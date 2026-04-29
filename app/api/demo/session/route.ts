import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { getOrCreateDemoInstance } from "@/lib/demo-sandbox";
import {
  DEMO_INSTANCE_COOKIE_NAME,
  getDemoSandboxTtlSeconds,
  isDemoModeEnabled,
} from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/server-auth";

const demoSessionSchema = z.object({
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
});

const resolveRoleUserId = (
  instance: Awaited<ReturnType<typeof getOrCreateDemoInstance>>,
  role: z.infer<typeof demoSessionSchema>["role"],
) => {
  if (role === "ADMIN") return instance.adminUserId;
  if (role === "TEACHER") return instance.teacherUserId;
  if (role === "STUDENT") return instance.studentUserId;
  return instance.parentUserId;
};

export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return jsonError("FORBIDDEN", "Demo mode is not enabled", 403);
  }

  const parsedBody = await parseJsonBody(request, demoSessionSchema);
  if (parsedBody instanceof Response) return parsedBody;

  const instanceCookie =
    request.cookies.get(DEMO_INSTANCE_COOKIE_NAME)?.value ?? null;
  const instance = await getOrCreateDemoInstance(instanceCookie);
  const userId = resolveRoleUserId(instance, parsedBody.role);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      schoolId: instance.schoolId,
      role: parsedBody.role,
    },
    select: {
      id: true,
      name: true,
      role: true,
      schoolId: true,
      onboardingCompletedAt: true,
    },
  });
  if (!user) {
    return jsonError("CONFLICT", "Demo user is not available", 409);
  }

  const token = await createSessionToken({
    userId: user.id,
    name: user.name,
    role: user.role,
    canUseDebugPanel: false,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    schoolId: user.schoolId,
    mustChangePassword: false,
    isDemo: true,
    demoInstanceId: instance.id,
  });

  const maxAge = Math.max(
    0,
    Math.min(
      getDemoSandboxTtlSeconds(),
      Math.floor((instance.expiresAt.getTime() - Date.now()) / 1000),
    ),
  );

  const response = jsonOk({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    canUseDebugPanel: false,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    roleSelectionRequired: false,
    schoolId: user.schoolId,
    mustChangePassword: false,
    isDemo: true,
    demoInstanceId: instance.id,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  response.cookies.set(DEMO_INSTANCE_COOKIE_NAME, instance.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}


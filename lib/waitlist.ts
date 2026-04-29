import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { AuthSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export const WAITLIST_SOURCES = [
  "landing_demo",
  "dashboard_demo_ribbon",
] as const;

export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export type WaitlistSubmitStatus = "joined" | "already_joined";

export const waitlistSubmitSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Email tidak valid"),
  source: z.enum(WAITLIST_SOURCES),
});

type WaitlistSessionMetadata = Pick<
  AuthSession,
  "userId" | "schoolId" | "role" | "demoInstanceId"
>;

type SubmitWaitlistEntryInput = {
  email: string;
  source: WaitlistSource;
  session?: WaitlistSessionMetadata | null;
};

export const normalizeWaitlistEmail = (email: string) =>
  email.trim().toLowerCase();

const getSessionMetadata = (session?: WaitlistSessionMetadata | null) => {
  if (!session) return null;
  return {
    userId: session.userId,
    schoolId: session.schoolId ?? null,
    role: session.role,
    demoInstanceId: session.demoInstanceId ?? null,
  };
};

const isUniqueWaitlistEmailConflict = (error: unknown) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== "P2002") return false;

  const target = error.meta?.target;
  return Array.isArray(target) && target.includes("emailNormalized");
};

export const submitWaitlistEntry = async ({
  email,
  source,
  session,
}: SubmitWaitlistEntryInput): Promise<{ status: WaitlistSubmitStatus }> => {
  const trimmedEmail = email.trim();
  const emailNormalized = normalizeWaitlistEmail(trimmedEmail);
  const sessionMetadata = getSessionMetadata(session);
  const updateData = {
    email: trimmedEmail,
    lastSource: source,
    submittedCount: { increment: 1 },
    ...(sessionMetadata ?? {}),
  };

  const existing = await prisma.waitlistEntry.findUnique({
    where: { emailNormalized },
    select: { id: true },
  });

  if (existing) {
    await prisma.waitlistEntry.update({
      where: { emailNormalized },
      data: updateData,
    });
    return { status: "already_joined" };
  }

  try {
    await prisma.waitlistEntry.create({
      data: {
        email: trimmedEmail,
        emailNormalized,
        firstSource: source,
        lastSource: source,
        ...(sessionMetadata ?? {}),
      },
    });
    return { status: "joined" };
  } catch (error) {
    if (!isUniqueWaitlistEmailConflict(error)) {
      throw error;
    }

    await prisma.waitlistEntry.update({
      where: { emailNormalized },
      data: updateData,
    });
    return { status: "already_joined" };
  }
};

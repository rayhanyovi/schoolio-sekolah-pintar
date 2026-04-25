import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { normalizeCredentialIdentifier } from "@/lib/auth-credential";
import {
  createSessionToken,
  isDebugImpersonationEnabled,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/server-auth";
import { Role, ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

const loginSchema = z.object({
  username: z.string().trim().min(1).optional(),
  identifier: z.string().trim().min(1).optional(),
  password: z.string().min(1),
});

type DemoAccount = {
  userId: string;
  name: string;
  role: Role;
  password: string;
  aliases: string[];
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    userId: "demo-admin",
    name: "Admin Demo",
    role: ROLES.ADMIN,
    password: "admin",
    aliases: ["admin", "admin@school.local"],
  },
  {
    userId: "demo-teacher",
    name: "Guru Demo",
    role: ROLES.TEACHER,
    password: "teacher",
    aliases: ["teacher", "teacher@school.local"],
  },
  {
    userId: "demo-student",
    name: "Siswa Demo",
    role: ROLES.STUDENT,
    password: "student",
    aliases: ["student", "student@school.local"],
  },
  {
    userId: "demo-parent",
    name: "Orang Tua Demo",
    role: ROLES.PARENT,
    password: "parent",
    aliases: ["parent", "parent@school.local"],
  },
];

const isDemoLoginEnabled = () => process.env.NODE_ENV !== "production";
const DEMO_SCHOOL_CODE = "SCH-DEMO01";

const findAccount = (username: string, password: string) =>
  DEMO_ACCOUNTS.find(
    (account) =>
      account.password === password &&
      account.aliases.some((alias) => alias === username)
  );

const ensureDemoSchoolAndUser = async (account: DemoAccount) => {
  const school = await prisma.schoolProfile.upsert({
    where: { schoolCode: DEMO_SCHOOL_CODE },
    update: {},
    create: {
      schoolCode: DEMO_SCHOOL_CODE,
      name: "Sekolah Demo",
      address: "Jalan Demo No. 1",
      phone: "",
      email: "demo@schoolio.local",
      website: "",
      principalName: "",
    },
    select: { id: true },
  });

  await prisma.user.upsert({
    where: { id: account.userId },
    update: {
      name: account.name,
      role: account.role,
      schoolId: school.id,
      onboardingCompletedAt: new Date(),
      roleSelectedAt: new Date(),
    },
    create: {
      id: account.userId,
      name: account.name,
      role: account.role,
      email: account.aliases.find((alias) => alias.includes("@")) ?? null,
      schoolId: school.id,
      onboardingCompletedAt: new Date(),
      roleSelectedAt: new Date(),
    },
    select: { id: true },
  });

  if (account.role === ROLES.TEACHER) {
    await prisma.teacherProfile.upsert({
      where: { userId: account.userId },
      update: {},
      create: { userId: account.userId },
    });
  } else if (account.role === ROLES.STUDENT) {
    await prisma.studentProfile.upsert({
      where: { userId: account.userId },
      update: {},
      create: { userId: account.userId, status: "ACTIVE" },
    });
  } else if (account.role === ROLES.PARENT) {
    await prisma.parentProfile.upsert({
      where: { userId: account.userId },
      update: {},
      create: { userId: account.userId },
    });
  }

  return school.id;
};

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("VALIDATION_ERROR", "Invalid request payload");
  }

  const parsed = loginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "identifier and password are required");
  }

  const identifierSource = parsed.data.identifier ?? parsed.data.username ?? "";
  const identifier = normalizeCredentialIdentifier(identifierSource);
  if (!identifier) {
    return jsonError("VALIDATION_ERROR", "identifier and password are required");
  }

  const demoAccount =
    isDemoLoginEnabled() ? findAccount(identifier, parsed.data.password) : null;
  if (demoAccount) {
    let schoolId: string | null = null;
    try {
      schoolId = await ensureDemoSchoolAndUser(demoAccount);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        return jsonError("CONFLICT", "Layanan database belum tersedia", 503);
      }
      throw error;
    }

    const canUseDebugPanel =
      demoAccount.role === ROLES.ADMIN && isDebugImpersonationEnabled();
    const token = await createSessionToken({
      userId: demoAccount.userId,
      name: demoAccount.name,
      role: demoAccount.role,
      canUseDebugPanel,
      onboardingCompleted: true,
      schoolId,
      mustChangePassword: false,
    });

    const response = jsonOk({
      user: {
        id: demoAccount.userId,
        name: demoAccount.name,
        role: demoAccount.role,
      },
      canUseDebugPanel,
      onboardingCompleted: true,
      schoolId,
      mustChangePassword: false,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return response;
  }

  const credential = await prisma.authCredential.findUnique({
    where: { identifier },
    select: {
      id: true,
      passwordSalt: true,
      passwordHash: true,
      mustChangePassword: true,
      isDefaultPassword: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          onboardingCompletedAt: true,
          schoolId: true,
        },
      },
    },
  });
  if (!credential) {
    return jsonError("UNAUTHORIZED", "Username atau kata sandi salah", 401);
  }

  const isValidPassword = await verifyPassword(
    parsed.data.password,
    credential.passwordSalt,
    credential.passwordHash
  );
  if (!isValidPassword) {
    return jsonError("UNAUTHORIZED", "Username atau kata sandi salah", 401);
  }

  const onboardingCompleted = Boolean(credential.user.onboardingCompletedAt);
  const mustChangePassword =
    credential.mustChangePassword || credential.isDefaultPassword;

  const token = await createSessionToken({
    userId: credential.user.id,
    name: credential.user.name,
    role: credential.user.role,
    canUseDebugPanel: false,
    onboardingCompleted,
    schoolId: credential.user.schoolId,
    mustChangePassword,
  });

  const response = jsonOk({
    user: {
      id: credential.user.id,
      name: credential.user.name,
      role: credential.user.role,
    },
    canUseDebugPanel: false,
    onboardingCompleted,
    schoolId: credential.user.schoolId,
    mustChangePassword,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import {
  createSessionToken,
  isDebugImpersonationEnabled,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/server-auth";
import { Role, ROLES } from "@/lib/constants";

const loginSchema = z.object({
  username: z.string().trim().min(1),
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

const normalizeUsername = (value: string) => value.trim().toLowerCase();

const findAccount = (username: string, password: string) =>
  DEMO_ACCOUNTS.find(
    (account) =>
      account.password === password &&
      account.aliases.some((alias) => alias === username)
  );

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("VALIDATION_ERROR", "Invalid request payload");
  }

  const parsed = loginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "username and password are required");
  }

  const username = normalizeUsername(parsed.data.username);
  const account = findAccount(username, parsed.data.password);
  if (!account) {
    return jsonError("INVALID_CREDENTIALS", "Username atau kata sandi salah", 401);
  }

  const canUseDebugPanel =
    account.role === ROLES.ADMIN && isDebugImpersonationEnabled();

  const token = await createSessionToken({
    userId: account.userId,
    name: account.name,
    role: account.role,
    canUseDebugPanel,
  });

  const response = jsonOk({
    user: {
      id: account.userId,
      name: account.name,
      role: account.role,
    },
    canUseDebugPanel,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}

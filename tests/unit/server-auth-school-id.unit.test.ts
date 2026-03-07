import {
  createSessionToken,
  verifySessionToken,
  SESSION_TTL_SECONDS,
} from "@/lib/server-auth";
import { ROLES } from "@/lib/constants";

const toBase64Url = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const signLegacyPayload = async (encodedPayload: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(process.env.SESSION_SECRET ?? "schoolio-dev-secret-change-me"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );
  return Buffer.from(signature)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

describe("server auth schoolId token", () => {
  it("membawa schoolId pada token baru", async () => {
    const token = await createSessionToken({
      userId: "admin-1",
      name: "Admin",
      role: ROLES.ADMIN,
      canUseDebugPanel: true,
      onboardingCompleted: true,
      schoolId: "school-1",
      mustChangePassword: true,
    });

    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.schoolId).toBe("school-1");
    expect(session?.mustChangePassword).toBe(true);
  });

  it("tetap bisa membaca token lama tanpa schoolId", async () => {
    const now = Math.floor(Date.now() / 1000);
    const legacyPayload = {
      userId: "teacher-1",
      name: "Guru",
      role: ROLES.TEACHER,
      canUseDebugPanel: false,
      onboardingCompleted: true,
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
    };
    const encodedPayload = toBase64Url(JSON.stringify(legacyPayload));
    const signature = await signLegacyPayload(encodedPayload);
    const token = `${encodedPayload}.${signature}`;

    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.schoolId).toBeNull();
    expect(session?.userId).toBe("teacher-1");
    expect(session?.mustChangePassword).toBe(false);
  });
});


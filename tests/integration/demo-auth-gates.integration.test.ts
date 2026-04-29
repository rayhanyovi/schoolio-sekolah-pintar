import { POST as register } from "@/app/api/auth/register/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";

const postJson = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("demo mode public auth gates", () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "true";
  });

  afterAll(() => {
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = originalDemoMode;
    }
  });

  it("menolak register manual", async () => {
    const response = await register(
      postJson("/api/auth/register", {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("menolak forgot password manual", async () => {
    const response = await forgotPassword(
      postJson("/api/auth/forgot-password", {
        email: "user@example.com",
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("menolak reset password manual", async () => {
    const response = await resetPassword(
      postJson("/api/auth/reset-password", {
        token: "token",
        password: "password123",
        confirmPassword: "password123",
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });
});


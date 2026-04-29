import {
  DEFAULT_DEMO_SANDBOX_TTL_HOURS,
  DEFAULT_DEMO_TEMPLATE_SCHOOL_CODE,
  getDemoSandboxTtlHours,
  getDemoTemplateSchoolCode,
  isDemoModeEnabled,
} from "@/lib/demo-mode";

describe("demo mode env parsing", () => {
  const originalEnv = {
    NEXT_PUBLIC_DEMO_MODE_ENABLED: process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED,
    DEMO_TEMPLATE_SCHOOL_CODE: process.env.DEMO_TEMPLATE_SCHOOL_CODE,
    DEMO_SANDBOX_TTL_HOURS: process.env.DEMO_SANDBOX_TTL_HOURS,
  };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED;
    delete process.env.DEMO_TEMPLATE_SCHOOL_CODE;
    delete process.env.DEMO_SANDBOX_TTL_HOURS;
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key as keyof NodeJS.ProcessEnv];
      } else {
        process.env[key as keyof NodeJS.ProcessEnv] = value;
      }
    }
  });

  it("membaca master switch secara eksplisit", () => {
    expect(isDemoModeEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "true";
    expect(isDemoModeEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = "false";
    expect(isDemoModeEnabled()).toBe(false);
  });

  it("memakai default untuk template school dan TTL", () => {
    expect(getDemoTemplateSchoolCode()).toBe(DEFAULT_DEMO_TEMPLATE_SCHOOL_CODE);
    expect(getDemoSandboxTtlHours()).toBe(DEFAULT_DEMO_SANDBOX_TTL_HOURS);
  });

  it("menolak TTL tidak valid", () => {
    process.env.DEMO_SANDBOX_TTL_HOURS = "-1";
    expect(getDemoSandboxTtlHours()).toBe(DEFAULT_DEMO_SANDBOX_TTL_HOURS);

    process.env.DEMO_SANDBOX_TTL_HOURS = "6.8";
    expect(getDemoSandboxTtlHours()).toBe(6);
  });
});


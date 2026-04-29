export const DEMO_INSTANCE_COOKIE_NAME = "schoolio_demo_instance";

export const DEFAULT_DEMO_TEMPLATE_SCHOOL_CODE = "SCH-ALHIKMAH";
export const DEFAULT_DEMO_SANDBOX_TTL_HOURS = 24;

export const DEMO_MODE_FORBIDDEN_MESSAGE =
  "Demo mode uses one-click entry from /demo.";

const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);

export const isDemoModeEnabled = () =>
  TRUE_VALUES.has(
    (process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED ?? "").trim().toLowerCase(),
  );

export const getDemoTemplateSchoolCode = () =>
  process.env.DEMO_TEMPLATE_SCHOOL_CODE?.trim() ||
  DEFAULT_DEMO_TEMPLATE_SCHOOL_CODE;

export const getDemoSandboxTtlHours = () => {
  const raw = process.env.DEMO_SANDBOX_TTL_HOURS?.trim();
  if (!raw) return DEFAULT_DEMO_SANDBOX_TTL_HOURS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DEMO_SANDBOX_TTL_HOURS;
  }

  return Math.floor(parsed);
};

export const getDemoSandboxTtlSeconds = () =>
  getDemoSandboxTtlHours() * 60 * 60;

export const getDemoSandboxExpiry = (from = new Date()) =>
  new Date(from.getTime() + getDemoSandboxTtlSeconds() * 1000);


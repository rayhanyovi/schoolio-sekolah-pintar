import { getAppMode } from "@/lib/app-mode";
import { resolveDatabaseUrl } from "@/lib/database-url";

const ENV_KEYS = [
  "APP_MODE",
  "DATABASE_URL",
  "SUPABASE_DATABASE_URL",
  "SUPABASE_DB_URL",
  "SUPABASE_POSTGRES_URL",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

const originalEnvValues = new Map<EnvKey, string | undefined>();

beforeAll(() => {
  for (const key of ENV_KEYS) {
    originalEnvValues.set(key, process.env[key]);
  }
});

beforeEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

afterAll(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnvValues.get(key);
    if (value === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = value;
  }
});

describe("app mode + database resolution", () => {
  it("defaults to self_host mode", () => {
    expect(getAppMode()).toBe("self_host");
  });

  it("parses saas mode value", () => {
    process.env.APP_MODE = "saas";
    expect(getAppMode()).toBe("saas");
  });

  it("resolves DATABASE_URL in self_host mode", () => {
    process.env.DATABASE_URL = "postgresql://self-host-db";
    expect(resolveDatabaseUrl()).toBe("postgresql://self-host-db");
  });

  it("throws when DATABASE_URL is missing in self_host mode", () => {
    expect(() => resolveDatabaseUrl()).toThrow(
      "DATABASE_URL is required in self_host mode."
    );
  });

  it("prefers SUPABASE_DATABASE_URL in saas mode", () => {
    process.env.APP_MODE = "saas";
    process.env.DATABASE_URL = "postgresql://self-host-db";
    process.env.SUPABASE_DATABASE_URL = "postgresql://supabase-db";

    expect(resolveDatabaseUrl()).toBe("postgresql://supabase-db");
  });

  it("uses SUPABASE_DB_URL alias in saas mode", () => {
    process.env.APP_MODE = "saas";
    process.env.SUPABASE_DB_URL = "postgresql://supabase-db-alias";

    expect(resolveDatabaseUrl()).toBe("postgresql://supabase-db-alias");
  });

  it("falls back to DATABASE_URL in saas mode", () => {
    process.env.APP_MODE = "saas";
    process.env.DATABASE_URL = "postgresql://fallback-db";

    expect(resolveDatabaseUrl()).toBe("postgresql://fallback-db");
  });

  it("throws when no database url is set in saas mode", () => {
    process.env.APP_MODE = "saas";

    expect(() => resolveDatabaseUrl()).toThrow(
      "Database URL is required in saas mode. Set SUPABASE_DATABASE_URL (recommended) or DATABASE_URL."
    );
  });
});

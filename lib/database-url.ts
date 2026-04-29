import { getAppMode } from "./app-mode";

const stripEnvQuotes = (value: string | undefined) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^['"]|['"]$/g, "");
};

const getDatabaseUrl = () => stripEnvQuotes(process.env.DATABASE_URL);

const getSupabaseDatabaseUrl = () =>
  stripEnvQuotes(
    process.env.SUPABASE_DATABASE_URL ??
      process.env.SUPABASE_DB_URL ??
      process.env.SUPABASE_POSTGRES_URL
  );

const normalizeSupabasePoolerUrl = (value: string) => {
  if (!value) return value;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }

  const isSupabasePooler = parsed.hostname.includes("pooler.supabase.com");
  const isTransactionPooler = parsed.port === "6543";
  if (!isSupabasePooler || !isTransactionPooler) {
    return value;
  }

  if (!parsed.searchParams.has("pgbouncer")) {
    parsed.searchParams.set("pgbouncer", "true");
  }
  if (!parsed.searchParams.has("connection_limit")) {
    parsed.searchParams.set("connection_limit", "1");
  }
  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  return parsed.toString();
};

export function resolveDatabaseUrl() {
  const mode = getAppMode();
  const databaseUrl = getDatabaseUrl();

  if (mode === "saas") {
    const supabaseDatabaseUrl = normalizeSupabasePoolerUrl(
      getSupabaseDatabaseUrl()
    );
    if (supabaseDatabaseUrl) {
      return supabaseDatabaseUrl;
    }

    if (databaseUrl) {
      return databaseUrl;
    }

    throw new Error(
      "Database URL is required in saas mode. Set SUPABASE_DATABASE_URL (recommended) or DATABASE_URL."
    );
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in self_host mode.");
  }

  return databaseUrl;
}

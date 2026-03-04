export type AppMode = "saas" | "self_host";

export function getAppMode(): AppMode {
  const rawValue = process.env.APP_MODE?.trim().toLowerCase();
  const raw = rawValue?.replace(/^['"]|['"]$/g, "");
  if (raw === "saas") {
    return "saas";
  }

  return "self_host";
}

export function isSaasMode() {
  return getAppMode() === "saas";
}

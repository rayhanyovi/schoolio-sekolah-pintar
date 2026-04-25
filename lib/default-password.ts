const DEFAULT_FALLBACK_PASSWORD = "password_default";

export const getDefaultUserPassword = () => {
  const fromEnv = process.env.DEFAULT_USER_PASSWORD?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_FALLBACK_PASSWORD;
};

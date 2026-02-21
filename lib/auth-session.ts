export const DEBUG_ACCESS_STORAGE_KEY = "schoolio:debug-access";

const isDebugImpersonationAllowed = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ENABLE_DEBUG_IMPERSONATION === "true";

export const setDebugAccess = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  const nextValue = isDebugImpersonationAllowed() && enabled;
  window.sessionStorage.setItem(DEBUG_ACCESS_STORAGE_KEY, nextValue ? "true" : "false");
};

export const hasDebugAccess = () => {
  if (typeof window === "undefined") return false;
  if (!isDebugImpersonationAllowed()) return false;
  return window.sessionStorage.getItem(DEBUG_ACCESS_STORAGE_KEY) === "true";
};

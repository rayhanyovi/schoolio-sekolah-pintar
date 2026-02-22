export type ErrorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type MonitorApiErrorInput = {
  code: string;
  message: string;
  status: number;
};

export const classifyApiErrorSeverity = (
  code: string,
  status: number
): ErrorSeverity => {
  if (status >= 500) return "CRITICAL";
  if (code === "VALIDATION_ERROR" || code === "NOT_FOUND" || code === "CONFLICT") {
    return "LOW";
  }
  if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
    return "MEDIUM";
  }
  return "HIGH";
};

export const monitorApiError = ({ code, message, status }: MonitorApiErrorInput) => {
  const severity = classifyApiErrorSeverity(code, status);
  const line = `[api-error] severity=${severity} status=${status} code=${code} message=${message}`;

  if (severity === "CRITICAL" || severity === "HIGH") {
    console.error(`[api-alert] ${line}`);
    return severity;
  }
  if (severity === "MEDIUM") {
    console.warn(`[api-monitor] ${line}`);
    return severity;
  }

  return severity;
};

import { apiGet } from "@/lib/api-client";
import { systemMetricsSchema } from "@/lib/schemas";

export const getSystemMetrics = () =>
  apiGet("/api/metrics").then((data) => systemMetricsSchema.parse(data));


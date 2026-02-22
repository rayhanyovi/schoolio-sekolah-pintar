import { apiGet, apiPost } from "@/lib/api-client";
import { notificationListSchema } from "@/lib/schemas";

export const listNotifications = async (params?: {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}) => notificationListSchema.parse(await apiGet("/api/notifications", params));

export const markNotificationAsRead = (id: string) =>
  apiPost(`/api/notifications/${id}/read`, {});

export const markAllNotificationsAsRead = () =>
  apiPost("/api/notifications/read-all", {});

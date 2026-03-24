import { http } from "./http";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  recipient_username?: string | null;
  recipient_role?: string | null;
  type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  created_by?: string | null;
};

export function listNotifications() {
  return http.get<NotificationItem[]>("/notifications/");
}

export function markNotificationRead(id: string) {
  return http.post(`/notifications/${id}/mark-read`);
}

export function markAllNotificationsRead() {
  return http.post("/notifications/mark-all-read");
}
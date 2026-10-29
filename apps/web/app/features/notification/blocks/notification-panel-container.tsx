import { useQuery } from "@tanstack/react-query";

import type { loader } from "@/app/routes/api.notifications";

import { NotificationPanel } from "./notification-panel";

type NotificationsResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchNotifications(): Promise<NotificationsResponse> {
  const response = await fetch("/api/notifications");
  if (!response.ok) {
    throw new Error("通知の取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<NotificationsResponse>;
}

const maybeString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export function NotificationPanelContainer() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const notifications = (data?.notifications ?? []).map((notification) => ({
    uri: notification.uri,
    authorName: notification.author.displayName ?? notification.author.handle,
    reason: notification.reason,
    text: ["reply", "quote", "mention"].includes(notification.reason)
      ? maybeString(notification.record.text)
      : maybeString(data?.subjectTexts[notification.reasonSubject ?? ""]),
  }));

  return <NotificationPanel notifications={notifications} />;
}

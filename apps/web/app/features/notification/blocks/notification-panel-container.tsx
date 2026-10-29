import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

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

export function NotificationPanelContainer() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });
  const ref = useRef<HTMLDivElement>(null);
  const latest = data?.notifications[0];

  useEffect(() => {
    if (!latest || latest.isRead || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      void fetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ seenAt: latest.indexedAt }),
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [latest]);

  const notifications = (data?.notifications ?? []).map((notification) => ({
    uri: notification.uri,
    authorName: notification.author.displayName ?? notification.author.handle,
    text:
      ["reply", "quote", "mention"].includes(notification.reason) &&
      typeof notification.record.text === "string"
        ? notification.record.text
        : undefined,
    isRead: notification.isRead,
  }));

  return (
    <div ref={ref}>
      <NotificationPanel notifications={notifications} />
    </div>
  );
}

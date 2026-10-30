import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import type { loader } from "@/app/routes/api.notifications";

import { NotificationPanel } from "./notification-panel";

type NotificationsResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchNotifications(
  cursor?: string,
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) {
    throw new Error("通知の取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<NotificationsResponse>;
}

const maybeString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export function NotificationPanelContainer() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["notifications"],
      queryFn: ({ pageParam }) => fetchNotifications(pageParam),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
    });
  const ref = useRef<HTMLDivElement>(null);
  const latest = data?.pages[0]?.notifications[0];

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

  const notifications = (data?.pages ?? []).flatMap((page) =>
    page.notifications.map((notification) => ({
      uri: notification.uri,
      authorName: notification.author.displayName ?? notification.author.handle,
      avatarUrl: notification.author.avatar,
      reason: notification.reason,
      text: ["reply", "quote", "mention"].includes(notification.reason)
        ? maybeString(notification.record.text)
        : maybeString(page.subjectTexts[notification.reasonSubject ?? ""]),
      isRead: notification.isRead,
    })),
  );

  return (
    <div ref={ref}>
      <NotificationPanel
        notifications={notifications}
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage && !isFetchingNextPage}
      />
    </div>
  );
}

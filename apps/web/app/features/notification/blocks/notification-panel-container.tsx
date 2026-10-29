import { useInfiniteQuery } from "@tanstack/react-query";

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

export function NotificationPanelContainer() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["notifications"],
      queryFn: ({ pageParam }) => fetchNotifications(pageParam),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      select: (data) => data.pages.flatMap((page) => page.notifications),
    });

  const notifications = (data ?? []).map((notification) => ({
    uri: notification.uri,
    authorName: notification.author.displayName ?? notification.author.handle,
  }));

  return (
    <NotificationPanel
      notifications={notifications}
      onLoadMore={fetchNextPage}
      canLoadMore={hasNextPage && !isFetchingNextPage}
    />
  );
}

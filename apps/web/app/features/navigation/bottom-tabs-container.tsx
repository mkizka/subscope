import { useQuery } from "@tanstack/react-query";

import type { loader } from "@/app/routes/api.notifications.unread-count";

import { BottomTabs } from "./bottom-tabs";
import { useMe } from "./side-nav-container";

type UnreadCountResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const response = await fetch("/api/notifications/unread-count");
  if (!response.ok) {
    throw new Error("未読数の取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<UnreadCountResponse>;
}

export function BottomTabsContainer() {
  const me = useMe();
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
  });

  return (
    <BottomTabs profileId={me?.profileId} unreadCount={data?.count ?? 0} />
  );
}

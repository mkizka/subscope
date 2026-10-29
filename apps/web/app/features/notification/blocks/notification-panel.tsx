import { clsx } from "clsx";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";

type Notification = {
  uri: string;
  authorName: string;
  reason: string;
  text?: string;
  isRead: boolean;
};

type Props = {
  notifications: Notification[];
  onLoadMore: () => void;
  hasNextPage: boolean;
};

const reasonLabels: Record<string, string> = {
  like: "さんがいいねしました",
  repost: "さんがリポストしました",
  follow: "さんにフォローされました",
};

export function NotificationPanel({
  notifications,
  onLoadMore,
  hasNextPage,
}: Props) {
  return (
    <section aria-label="通知" className="p-4">
      <h2 className="font-bold">通知</h2>
      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm opacity-60">
          通知はまだありません
        </p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li
              key={notification.uri}
              className={clsx(
                "border-b border-base-300 py-2",
                !notification.isRead && "bg-base-200",
              )}
            >
              <p>
                {notification.authorName}
                {reasonLabels[notification.reason]}
              </p>
              {notification.text && (
                <p className="text-sm whitespace-pre-wrap">
                  {notification.text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <InfiniteScrollTrigger onIntersect={onLoadMore} enabled={hasNextPage} />
    </section>
  );
}

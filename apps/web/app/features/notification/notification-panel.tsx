import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  AtSignIcon,
  HeartIcon,
  MessageCircleIcon,
  QuoteIcon,
  Repeat2Icon,
  UserPlusIcon,
} from "lucide-react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { NotificationsSkeleton } from "@/app/components/rows-skeleton";
import { Avatar } from "@/app/components/ui/avatar";

type Notification = {
  uri: string;
  authorName: string;
  authorHandle: string;
  avatarUrl?: string;
  reason: string;
  text?: string;
  isRead: boolean;
};

type Props = {
  notifications: Notification[];
  onLoadMore: () => void;
  hasNextPage: boolean;
  isLoading?: boolean;
};

const reasons: Record<
  string,
  { label: string; name: string; icon: LucideIcon; color?: string }
> = {
  like: {
    label: "さんがいいねしました",
    name: "いいね",
    icon: HeartIcon,
  },
  repost: {
    label: "さんがリポストしました",
    name: "リポスト",
    icon: Repeat2Icon,
    color: "text-repost",
  },
  follow: {
    label: "さんにフォローされました",
    name: "フォロー",
    icon: UserPlusIcon,
  },
  reply: {
    label: "さんが返信しました",
    name: "返信",
    icon: MessageCircleIcon,
  },
  quote: {
    label: "さんが引用しました",
    name: "引用",
    icon: QuoteIcon,
  },
  mention: {
    label: "さんがメンションしました",
    name: "メンション",
    icon: AtSignIcon,
  },
};

export function NotificationPanel({
  notifications,
  onLoadMore,
  hasNextPage,
  isLoading,
}: Props) {
  return (
    <section aria-label="通知">
      <h2 className="border-b border-line px-4 py-3 text-title">通知</h2>
      {isLoading ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <p className="py-8 text-center text-label text-muted">
          通知はまだありません
        </p>
      ) : (
        <ul>
          {notifications.map((notification) => {
            const reason = reasons[notification.reason];
            const Icon = reason?.icon;
            return (
              <li
                key={notification.uri}
                className={clsx(
                  "flex gap-3 border-b border-line px-4 py-3",
                  !notification.isRead && "bg-surface-2",
                )}
              >
                <div className="flex w-10 shrink-0 justify-end pt-2">
                  {Icon && (
                    <Icon
                      role="img"
                      aria-label={reason.name}
                      className={clsx("size-6", reason.color ?? "text-brand")}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Avatar src={notification.avatarUrl} />
                  <p className="mt-2">
                    <span className="font-bold">{notification.authorName}</span>
                    {reason?.label}
                  </p>
                  <p className="text-label text-muted">
                    @{notification.authorHandle}
                  </p>
                  {notification.text && (
                    <p
                      className="
                        mt-1 text-label wrap-break-word whitespace-pre-wrap
                        text-muted
                      "
                    >
                      {notification.text}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <InfiniteScrollTrigger onIntersect={onLoadMore} enabled={hasNextPage} />
    </section>
  );
}

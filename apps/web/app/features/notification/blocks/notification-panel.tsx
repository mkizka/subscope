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

type Notification = {
  uri: string;
  authorName: string;
  avatarUrl?: string;
  reason: string;
  text?: string;
  isRead: boolean;
};

type Props = {
  notifications: Notification[];
  onLoadMore: () => void;
  hasNextPage: boolean;
};

const reasons: Record<
  string,
  { label: string; name: string; icon: LucideIcon; color: string }
> = {
  like: {
    label: "さんがいいねしました",
    name: "いいね",
    icon: HeartIcon,
    color: "text-pink-500",
  },
  repost: {
    label: "さんがリポストしました",
    name: "リポスト",
    icon: Repeat2Icon,
    color: "text-green-600",
  },
  follow: {
    label: "さんにフォローされました",
    name: "フォロー",
    icon: UserPlusIcon,
    color: "text-sky-500",
  },
  reply: {
    label: "さんが返信しました",
    name: "返信",
    icon: MessageCircleIcon,
    color: "text-primary",
  },
  quote: {
    label: "さんが引用しました",
    name: "引用",
    icon: QuoteIcon,
    color: "text-primary",
  },
  mention: {
    label: "さんがメンションしました",
    name: "メンション",
    icon: AtSignIcon,
    color: "text-primary",
  },
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
          {notifications.map((notification) => {
            const reason = reasons[notification.reason];
            const Icon = reason?.icon;
            return (
              <li
                key={notification.uri}
                className={clsx(
                  "flex gap-3 border-b border-base-300 py-2",
                  !notification.isRead && "bg-base-200",
                )}
              >
                <div className="w-6 shrink-0">
                  {Icon && (
                    <Icon
                      role="img"
                      aria-label={reason.name}
                      className={clsx("size-6", reason.color)}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {notification.avatarUrl ? (
                    <img
                      src={notification.avatarUrl}
                      alt=""
                      className="size-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-base-300" />
                  )}
                  <p>
                    <span className="font-bold">{notification.authorName}</span>
                    {reason?.label}
                  </p>
                  {notification.text && (
                    <p className="text-sm whitespace-pre-wrap opacity-70">
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

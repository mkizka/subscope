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
  { label: string; name: string; icon: LucideIcon }
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
}: Props) {
  return (
    <section aria-label="通知">
      <h2
        className="
          sticky top-0 border-b border-line bg-surface px-4 py-3 text-title
        "
      >
        通知
      </h2>
      {notifications.length === 0 ? (
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
                  !notification.isRead && "bg-brand-soft",
                )}
              >
                <div className="flex w-7 shrink-0 justify-center pt-1">
                  {Icon && (
                    <Icon
                      role="img"
                      aria-label={reason.name}
                      className="size-6 text-brand"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {notification.avatarUrl ? (
                    <img
                      src={notification.avatarUrl}
                      alt=""
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-7 rounded-full bg-surface-2" />
                  )}
                  <p className="mt-1">
                    <span className="font-bold">{notification.authorName}</span>
                    {reason?.label}
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

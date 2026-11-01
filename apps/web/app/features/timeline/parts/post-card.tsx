import {
  HeartIcon,
  type LucideIcon,
  MessageCircleIcon,
  RepeatIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

import { useHydrated } from "@/app/lib/use-hydrated";

import { type PostImage, PostImages } from "./post-images";

export type PostCardProps = {
  authorAvatar?: string;
  authorDisplayName?: string;
  authorHandle: string;
  text?: string;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  createdAt?: string;
  images?: PostImage[];
  quote?: { authorDisplayName?: string; authorHandle: string; text?: string };
  reasonRepost?: {
    byDisplayName?: string;
    byHandle: string;
  };
  toolbar?: ReactNode;
  threadSearch?: string;
};

function formatRelativeTime(dateString: string) {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}秒`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}分`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}日`;
  return new Date(dateString).toLocaleDateString("ja-JP");
}

function CountChip(props: { Icon: LucideIcon; count?: number; label: string }) {
  if (!props.count) return null;
  return (
    <span
      title={`${props.count}件の${props.label}`}
      className="badge gap-1 badge-ghost badge-sm"
    >
      <props.Icon className="size-3" />
      {props.count}
    </span>
  );
}

export function ProfileLink({
  handle,
  ...props
}: Omit<ComponentProps<typeof Link>, "to"> & { handle: string }) {
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  params.delete("thread");
  params.set("profile", handle);
  return (
    <Link {...props} to={{ search: params.toString() }} preventScrollReset />
  );
}

export function QuotedPost({
  quote,
}: {
  quote: NonNullable<PostCardProps["quote"]>;
}) {
  return (
    <blockquote className="mt-2 rounded-box border border-base-300 px-3 py-2">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="truncate font-bold">
          {quote.authorDisplayName ?? quote.authorHandle}
        </span>
        <span className="truncate text-base-content/60">
          @{quote.authorHandle}
        </span>
      </div>
      <p className="text-sm wrap-break-word whitespace-pre-wrap">
        {quote.text}
      </p>
    </blockquote>
  );
}

export function PostCard({
  authorAvatar,
  authorDisplayName,
  authorHandle,
  text,
  replyCount,
  repostCount,
  likeCount,
  createdAt,
  images,
  quote,
  reasonRepost,
  toolbar,
  threadSearch,
}: PostCardProps) {
  const hydrated = useHydrated();
  return (
    <article
      className="
        relative px-4 py-2
        hover:bg-base-200
      "
    >
      {threadSearch && (
        <Link
          to={{ search: threadSearch }}
          preventScrollReset
          aria-label="スレッドを開く"
          className="absolute inset-0"
        />
      )}
      {reasonRepost && (
        <div
          className="
            mb-1 flex items-center gap-1 pl-12 text-xs text-base-content/70
          "
        >
          <RepeatIcon className="size-3" />
          <span>
            {reasonRepost.byDisplayName ?? reasonRepost.byHandle}
            がリポスト
          </span>
        </div>
      )}
      <div className="flex gap-3">
        <ProfileLink
          handle={authorHandle}
          aria-label={authorDisplayName ?? authorHandle}
          className="relative shrink-0 self-start"
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt=""
              className="size-9 rounded-md object-cover"
            />
          ) : (
            <div className="size-9 rounded-md bg-base-300" />
          )}
        </ProfileLink>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <ProfileLink
              handle={authorHandle}
              className="
                relative truncate font-bold
                hover:underline
              "
            >
              {authorDisplayName ?? authorHandle}
            </ProfileLink>
            <span className="shrink-0 text-xs text-base-content/60">
              {createdAt
                ? hydrated && formatRelativeTime(createdAt)
                : "日時不明"}
            </span>
          </div>
          <p className="wrap-break-word whitespace-pre-wrap">{text}</p>
          {images && <PostImages images={images} />}
          {quote && <QuotedPost quote={quote} />}
          {toolbar ?? (
            <>
              <div
                className="
                  mt-1 flex gap-1
                  empty:hidden
                "
              >
                <CountChip
                  Icon={RepeatIcon}
                  count={repostCount}
                  label="リポスト"
                />
                <CountChip Icon={HeartIcon} count={likeCount} label="いいね" />
              </div>
              {!!replyCount && (
                <div
                  className="
                    mt-1 flex items-center gap-1 text-sm font-bold text-primary
                  "
                >
                  <MessageCircleIcon className="size-4" />
                  {replyCount}件の返信
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

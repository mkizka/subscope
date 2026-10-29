import { HeartIcon, MessageCircleIcon, RepeatIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

export type PostCardProps = {
  authorAvatar?: string;
  authorDisplayName?: string;
  authorHandle: string;
  text?: string;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  createdAt?: string;
  images?: { thumb: string; alt: string }[];
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
  reasonRepost,
  toolbar,
  threadSearch,
}: PostCardProps) {
  return (
    <article className="group relative border-b border-border/40 px-4 py-3">
      {threadSearch && (
        <Link
          to={{ search: threadSearch }}
          aria-label="スレッドを開く"
          className="absolute inset-0"
        />
      )}
      {toolbar}
      {reasonRepost && (
        <div
          className="
            mb-1 flex items-center gap-1 pl-10 text-xs text-muted-foreground
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
        <div className="shrink-0">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt=""
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="size-10 rounded-full bg-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="truncate font-semibold">
              {authorDisplayName ?? authorHandle}
            </span>
            <span className="truncate text-muted-foreground">
              @{authorHandle}
            </span>
            <span className="shrink-0 text-muted-foreground">
              · {createdAt ? formatRelativeTime(createdAt) : "日時不明"}
            </span>
          </div>
          <p className="mt-1 wrap-break-word whitespace-pre-wrap">{text}</p>
          {images && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {images.map((image) => (
                <img
                  key={image.thumb}
                  src={image.thumb}
                  alt={image.alt}
                  className="w-full rounded-sm object-cover"
                />
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-6 text-muted-foreground">
            <span className="flex items-center gap-1 text-sm">
              <MessageCircleIcon className="size-4" />
              {replyCount ?? 0}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <RepeatIcon className="size-4" />
              {repostCount ?? 0}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <HeartIcon className="size-4" />
              {likeCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

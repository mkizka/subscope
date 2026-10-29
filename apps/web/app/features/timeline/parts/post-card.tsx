import { RepeatIcon } from "lucide-react";
import type { ReactNode } from "react";

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
}: PostCardProps) {
  return (
    <article className="group relative border-b border-base-300 px-4 py-3">
      {toolbar}
      {reasonRepost && (
        <div
          className="
            mb-1 flex items-center gap-1 pl-10 text-xs text-base-content/70
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
            <div className="size-10 rounded-full bg-base-200" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="truncate font-semibold">
              {authorDisplayName ?? authorHandle}
            </span>
            <span className="truncate text-base-content/70">
              @{authorHandle}
            </span>
            <span className="shrink-0 text-base-content/70">
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
          <div
            className="
              mt-2 flex gap-2
              empty:hidden
            "
          >
            {!!replyCount && (
              <span className="badge badge-sm">{replyCount}件の返信</span>
            )}
            {!!repostCount && (
              <span className="badge badge-sm">{repostCount}件のリポスト</span>
            )}
            {!!likeCount && (
              <span className="badge badge-sm">{likeCount}件のいいね</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

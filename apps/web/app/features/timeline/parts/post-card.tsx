import {
  HeartIcon,
  type LucideIcon,
  MessageCircleIcon,
  RepeatIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { useHydrated } from "@/app/lib/use-hydrated";

import { type PostImage, PostImages } from "./post-images";
import { ProfileLink } from "./profile-link";
import { RichText, type TextLink } from "./rich-text";

export type PostCardProps = {
  authorAvatar?: string;
  authorDisplayName?: string;
  authorHandle: string;
  text?: string;
  links?: TextLink[];
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  createdAt?: string;
  images?: PostImage[];
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  quote?: { authorDisplayName?: string; authorHandle: string; text?: string };
  reasonRepost?: {
    byDisplayName?: string;
    byHandle: string;
  };
  toolbar?: ReactNode;
  threadPath?: string;
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
    <span title={`${props.count}件の${props.label}`}>
      <Badge>
        <props.Icon className="mr-1 size-4" />
        {props.count}
      </Badge>
    </span>
  );
}

export function QuotedPost({
  quote,
}: {
  quote: NonNullable<PostCardProps["quote"]>;
}) {
  return (
    <blockquote className="mt-2 rounded-xl border border-line px-3 py-2">
      <div className="flex items-baseline gap-2 text-label">
        <span className="truncate font-bold">
          {quote.authorDisplayName ?? quote.authorHandle}
        </span>
        <span className="truncate text-muted">@{quote.authorHandle}</span>
      </div>
      <p className="text-label wrap-break-word whitespace-pre-wrap">
        {quote.text}
      </p>
    </blockquote>
  );
}

export function ExternalCard({
  external,
}: {
  external: NonNullable<PostCardProps["external"]>;
}) {
  return (
    <a
      href={external.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="
        relative mt-2 block overflow-hidden rounded-xl border border-line
        hover:bg-surface-2
      "
    >
      {external.thumb && (
        <img
          src={external.thumb}
          alt=""
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="px-3 py-2">
        <div className="truncate text-caption text-muted">
          {URL.canParse(external.uri)
            ? new URL(external.uri).host
            : external.uri}
        </div>
        <div className="line-clamp-2 text-label font-bold">
          {external.title}
        </div>
        <div className="line-clamp-2 text-label">{external.description}</div>
      </div>
    </a>
  );
}

export function PostCard({
  authorAvatar,
  authorDisplayName,
  authorHandle,
  text,
  links,
  replyCount,
  repostCount,
  likeCount,
  createdAt,
  images,
  external,
  quote,
  reasonRepost,
  toolbar,
  threadPath,
}: PostCardProps) {
  const hydrated = useHydrated();
  return (
    <article
      className="
        relative border-b border-line px-4 py-3
        hover:bg-surface-2
      "
    >
      {threadPath && (
        <Link
          to={threadPath}
          aria-label="スレッドを開く"
          className="absolute inset-0"
        />
      )}
      <div className="flex gap-3">
        <ProfileLink
          handle={authorHandle}
          aria-label={authorDisplayName ?? authorHandle}
          className="relative shrink-0 self-start"
        >
          <Avatar src={authorAvatar} />
        </ProfileLink>
        <div className="min-w-0 flex-1">
          {reasonRepost && (
            <div className="mb-1 flex items-center gap-1 text-caption text-muted">
              <RepeatIcon className="size-4" />
              <span>
                {reasonRepost.byDisplayName ?? reasonRepost.byHandle}
                がリポスト
              </span>
            </div>
          )}
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
            <span className="shrink-0 text-label text-muted">
              {createdAt
                ? hydrated && formatRelativeTime(createdAt)
                : "日時不明"}
            </span>
          </div>
          <p className="wrap-break-word whitespace-pre-wrap">
            {text && <RichText text={text} links={links} />}
          </p>
          {images && <PostImages images={images} />}
          {external && <ExternalCard external={external} />}
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
                    mt-1 flex items-center gap-1 text-label font-bold text-brand
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

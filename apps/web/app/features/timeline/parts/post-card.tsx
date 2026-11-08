import { clsx } from "clsx";
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
import { PostVideo, type PostVideoData } from "./post-video";
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
  video?: PostVideoData;
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  quote?: {
    authorAvatar?: string;
    authorDisplayName?: string;
    authorHandle: string;
    text?: string;
    links?: TextLink[];
    images?: PostImage[];
    video?: PostVideoData;
    threadPath?: string;
    external?: NonNullable<PostCardProps["external"]>;
  };
  quoteUnavailable?: "notFound" | "blocked" | "detached";
  quotedFeed?: {
    avatar?: string;
    displayName: string;
    creatorHandle: string;
    description?: string;
  };
  reasonRepost?: {
    byDisplayName?: string;
    byHandle: string;
  };
  toolbar?: ReactNode;
  threadPath?: string;
  connectedAbove?: boolean;
  connectedBelow?: boolean;
};

export function formatRelativeTime(dateString: string) {
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

const unavailableLabels = {
  notFound: "引用元の投稿は削除されました",
  blocked: "ブロックされた投稿のため表示できません",
  detached: "投稿者により引用が解除されました",
};

export function UnavailableQuote({
  reason,
}: {
  reason: NonNullable<PostCardProps["quoteUnavailable"]>;
}) {
  return (
    <blockquote
      className="
        mt-2 rounded-xl border border-line px-3 py-2 text-label text-muted
      "
    >
      {unavailableLabels[reason]}
    </blockquote>
  );
}

export function QuotedPost({
  quote,
}: {
  quote: NonNullable<PostCardProps["quote"]>;
}) {
  return (
    <blockquote className="relative mt-2 rounded-xl border border-line px-3 py-2">
      {quote.threadPath && (
        <Link
          to={quote.threadPath}
          aria-label="引用された投稿のスレッドを開く"
          className="absolute inset-0 rounded-xl"
        />
      )}
      <div className="flex items-center gap-2 text-label">
        <Avatar src={quote.authorAvatar} size="sm" />
        <span className="truncate font-bold">
          {quote.authorDisplayName ?? quote.authorHandle}
        </span>
        <span className="truncate text-muted">@{quote.authorHandle}</span>
      </div>
      <p className="text-label wrap-break-word whitespace-pre-wrap">
        {quote.text && <RichText text={quote.text} links={quote.links} />}
      </p>
      {quote.images && <PostImages images={quote.images} />}
      {quote.video && <PostVideo video={quote.video} />}
      {quote.external && <ExternalCard external={quote.external} />}
    </blockquote>
  );
}

export function QuotedFeed({
  feed,
}: {
  feed: NonNullable<PostCardProps["quotedFeed"]>;
}) {
  return (
    <blockquote className="mt-2 rounded-xl border border-line px-3 py-2">
      <div className="flex items-center gap-2 text-label">
        <Avatar src={feed.avatar} size="sm" />
        <span className="truncate font-bold">{feed.displayName}</span>
      </div>
      <div className="text-caption text-muted">
        フィード by @{feed.creatorHandle}
      </div>
      {feed.description && (
        <p className="text-label wrap-break-word whitespace-pre-wrap">
          {feed.description}
        </p>
      )}
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
  video,
  external,
  quote,
  quoteUnavailable,
  quotedFeed,
  reasonRepost,
  toolbar,
  threadPath,
  connectedAbove,
  connectedBelow,
}: PostCardProps) {
  const hydrated = useHydrated();
  return (
    <article
      className={clsx(
        `
          relative border-line px-4 py-3
          hover:bg-surface-2
        `,
        !connectedBelow && "border-b",
      )}
    >
      {connectedAbove && (
        <span
          data-testid="thread-line"
          className="absolute top-0 left-[35px] h-3 w-0.5 bg-line"
        />
      )}
      {connectedBelow && (
        <span
          data-testid="thread-line"
          className="absolute top-[52px] bottom-0 left-[35px] w-0.5 bg-line"
        />
      )}
      {threadPath && (
        <Link
          to={threadPath}
          aria-label="スレッドを開く"
          className="absolute inset-0"
        />
      )}
      {reasonRepost && (
        <div className="mb-1 flex items-center gap-3 text-caption text-muted">
          <RepeatIcon className="ml-6 size-4 shrink-0" />
          <ProfileLink
            handle={reasonRepost.byHandle}
            className="
              relative truncate
              hover:underline
            "
          >
            {reasonRepost.byDisplayName ?? reasonRepost.byHandle}がリポスト
          </ProfileLink>
        </div>
      )}
      <div className="flex gap-3">
        <ProfileLink
          handle={authorHandle}
          aria-label={authorDisplayName ?? authorHandle}
          className="relative shrink-0 self-start"
        >
          <Avatar src={authorAvatar} />
        </ProfileLink>
        <div className="min-w-0 flex-1 text-label">
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
            <span className="min-w-0 truncate text-label text-muted">
              @{authorHandle}
            </span>
            <span className="shrink-0 text-label text-muted">
              {createdAt
                ? hydrated && formatRelativeTime(createdAt)
                : "日時不明"}
            </span>
          </div>
          <p className="mt-1 wrap-break-word whitespace-pre-wrap">
            {text && <RichText text={text} links={links} />}
          </p>
          {images && <PostImages images={images} />}
          {video && <PostVideo video={video} />}
          {external && <ExternalCard external={external} />}
          {quote && <QuotedPost quote={quote} />}
          {quoteUnavailable && <UnavailableQuote reason={quoteUnavailable} />}
          {quotedFeed && <QuotedFeed feed={quotedFeed} />}
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

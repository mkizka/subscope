import type { ProfileLinkView } from "@repo/client/app/bsky/actor/defs";
import { Link as LinkIcon } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { ImageViewer } from "@/app/components/ui/image-viewer";
import { Skeleton } from "@/app/components/ui/skeleton";
import { BackfillStatusBadge } from "@/app/features/account/backfill-status-badge";
import type { BackfillStatus } from "@/app/lib/backfill-status";

import { UntrackedBadge } from "./untracked-badge";

type Props = {
  loading?: boolean;
  displayName?: string;
  handle: string;
  avatarUrl?: string;
  bannerUrl?: string;
  description?: string;
  links?: ProfileLinkView[];
  followsCount?: number;
  followersCount?: number;
  backfillStatus?: BackfillStatus;
  untracked?: boolean;
  followedBy?: boolean;
  knownFollowers?: {
    count: number;
    followers: {
      did: string;
      displayName?: string;
      handle: string;
      avatar?: string;
    }[];
  };
  action?: ReactNode;
};

export function ProfileHeader({
  loading,
  displayName,
  handle,
  avatarUrl,
  bannerUrl,
  description,
  links,
  followsCount,
  followersCount,
  backfillStatus,
  untracked,
  followedBy,
  knownFollowers,
  action,
}: Props) {
  const [viewing, setViewing] = useState<string>();
  if (loading) {
    return (
      <section
        role="status"
        aria-label="読み込み中"
        className="border-b border-line"
      >
        <div className="h-32 skeleton" />
        <div className="flex flex-col gap-2 px-4 pb-4">
          <Skeleton className="-mt-10 size-20 border-4 border-surface" />
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-col gap-2 py-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="border-b border-line">
      {bannerUrl ? (
        <button
          type="button"
          aria-label="バナーを拡大"
          className="block w-full cursor-zoom-in"
          onClick={() => setViewing(bannerUrl)}
        >
          <img src={bannerUrl} alt="" className="h-32 w-full object-cover" />
        </button>
      ) : (
        <div className="h-32 bg-surface-2" />
      )}
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex items-end justify-between">
          <button
            type="button"
            aria-label="アイコンを拡大"
            disabled={!avatarUrl}
            className="
              -mt-10 cursor-zoom-in rounded-full border-4 border-surface
              disabled:cursor-default
            "
            onClick={() => setViewing(avatarUrl)}
          >
            <Avatar src={avatarUrl} size="lg" />
          </button>
          {action}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-title">{displayName || handle}</h1>
          <div className="flex items-center gap-2">
            <p className="truncate text-label text-muted">@{handle}</p>
            {followedBy && <Badge>フォローされています</Badge>}
            {backfillStatus && <BackfillStatusBadge status={backfillStatus} />}
            {untracked && <UntrackedBadge />}
          </div>
        </div>
        {description && (
          <p className="text-body wrap-break-word whitespace-pre-wrap">
            {description}
          </p>
        )}
        {links && links.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-label">
            {links.map((link) => (
              <li key={link.uri} className="min-w-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex h-10 max-w-full items-center gap-2 rounded-full border
                    border-line px-3
                    hover:bg-surface-2
                  "
                >
                  {link.icon ? (
                    <img src={link.icon} alt="" className="size-4 rounded-xs" />
                  ) : (
                    <LinkIcon className="size-4 shrink-0" />
                  )}
                  <span className="truncate">
                    {link.title || new URL(link.url).hostname}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-4 text-label text-muted">
          <Link to={`/${handle}/follows`} className="hover:underline">
            <b className="text-ink">{followsCount}</b> フォロー
          </Link>
          <Link to={`/${handle}/followers`} className="hover:underline">
            <b className="text-ink">{followersCount}</b> フォロワー
          </Link>
        </div>
        {knownFollowers && (
          <Link
            to={`/${handle}/followers?filter=known`}
            className="
              flex items-center gap-2 text-label text-muted
              hover:underline
            "
          >
            <span className="flex">
              {knownFollowers.followers.slice(0, 3).map((follower) => (
                <span
                  key={follower.did}
                  className="
                    -ml-2 rounded-full border-2 border-surface
                    first:ml-0
                  "
                >
                  <Avatar src={follower.avatar} size="xs" />
                </span>
              ))}
            </span>
            <span>
              {knownFollowers.followers.slice(0, 2).map((follower, i) => (
                <Fragment key={follower.did}>
                  {i > 0 && "、"}
                  <b className="text-ink">
                    {follower.displayName || follower.handle}
                  </b>
                </Fragment>
              ))}
              {knownFollowers.count > 2 && `ほか${knownFollowers.count - 2}人`}
              がフォローしています
            </span>
          </Link>
        )}
      </div>
      <ImageViewer
        images={viewing ? [{ src: viewing, alt: "" }] : []}
        index={viewing ? 0 : -1}
        onIndexChange={(index) => {
          if (index < 0) setViewing(undefined);
        }}
      />
    </section>
  );
}

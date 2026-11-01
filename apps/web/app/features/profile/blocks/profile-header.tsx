import type { ReactNode } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";

type Props = {
  displayName?: string;
  handle: string;
  avatarUrl?: string;
  bannerUrl?: string;
  description?: string;
  followsCount: number;
  followersCount: number;
  action?: ReactNode;
};

export function ProfileHeader({
  displayName,
  handle,
  avatarUrl,
  bannerUrl,
  description,
  followsCount,
  followersCount,
  action,
}: Props) {
  return (
    <section className="border-b border-line">
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="h-32 bg-surface-2" />
      )}
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex items-end justify-between">
          <span className="-mt-10 rounded-full border-4 border-surface">
            <Avatar src={avatarUrl} size="lg" />
          </span>
          {action}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-title">{displayName || handle}</h1>
          <p className="truncate text-label text-muted">@{handle}</p>
        </div>
        {description && (
          <p className="text-body wrap-break-word whitespace-pre-wrap">
            {description}
          </p>
        )}
        <div className="flex gap-4 text-label text-muted">
          <Link to={`/profile/${handle}/follows`} className="hover:underline">
            <b className="text-ink">{followsCount}</b> フォロー
          </Link>
          <Link to={`/profile/${handle}/followers`} className="hover:underline">
            <b className="text-ink">{followersCount}</b> フォロワー
          </Link>
        </div>
      </div>
    </section>
  );
}

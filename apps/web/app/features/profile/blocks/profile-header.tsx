import type { ReactNode } from "react";
import { Link } from "react-router";

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
        <div className="h-32 bg-line" />
      )}
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex items-end justify-between">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="
                -mt-10 size-20 rounded-full border-4 border-surface object-cover
              "
            />
          ) : (
            <div
              className="
                -mt-10 size-20 rounded-full border-4 border-surface bg-line
              "
            />
          )}
          {action}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">
            {displayName || handle}
          </h1>
          <p className="truncate text-sm text-muted">@{handle}</p>
        </div>
        {description && (
          <p className="text-sm wrap-break-word whitespace-pre-wrap">
            {description}
          </p>
        )}
        <div className="flex gap-4 text-sm text-muted">
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

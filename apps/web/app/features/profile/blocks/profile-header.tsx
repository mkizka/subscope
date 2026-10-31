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
    <section className="border-b border-base-300">
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="h-32 bg-base-300" />
      )}
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex items-end justify-between">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="
                -mt-10 size-20 rounded-full border-4 border-base-100
                object-cover
              "
            />
          ) : (
            <div
              className="
                -mt-10 size-20 rounded-full border-4 border-base-100 bg-base-300
              "
            />
          )}
          {action}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">
            {displayName || handle}
          </h1>
          <p className="truncate text-sm text-base-content/60">@{handle}</p>
        </div>
        {description && (
          <p className="text-sm wrap-break-word whitespace-pre-wrap">
            {description}
          </p>
        )}
        <div className="flex gap-4 text-sm">
          <Link to={`/profile/${handle}/follows`} className="hover:underline">
            <b>{followsCount}</b> フォロー
          </Link>
          <Link to={`/profile/${handle}/followers`} className="hover:underline">
            <b>{followersCount}</b> フォロワー
          </Link>
        </div>
      </div>
    </section>
  );
}

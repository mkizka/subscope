import { type ReactNode, useState } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { ImageViewer } from "@/app/components/ui/image-viewer";

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
  const [viewing, setViewing] = useState<string>();
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

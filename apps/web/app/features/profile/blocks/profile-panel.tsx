import { XIcon } from "lucide-react";
import { Link } from "react-router";

type Props = {
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  followsCount?: number;
  followersCount?: number;
  closeSearch: string;
};

export function ProfilePanel({
  handle,
  displayName,
  avatarUrl,
  description,
  followsCount,
  followersCount,
  closeSearch,
}: Props) {
  return (
    <section aria-label="プロフィール" className="flex flex-col gap-3 p-4">
      <Link
        to={{ search: closeSearch }}
        preventScrollReset
        aria-label="閉じる"
        className="btn btn-square self-end btn-ghost"
      >
        <XIcon />
      </Link>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-16 rounded-full object-cover"
        />
      ) : (
        <div className="size-16 rounded-full bg-base-300" />
      )}
      <div>
        <h2 className="text-lg font-bold">{displayName ?? handle}</h2>
        <p className="text-sm opacity-60">@{handle}</p>
      </div>
      {description && (
        <p className="text-sm wrap-break-word whitespace-pre-wrap">
          {description}
        </p>
      )}
      <div className="flex gap-4 text-sm">
        <span>
          <b>{followsCount ?? 0}</b> フォロー
        </span>
        <span>
          <b>{followersCount ?? 0}</b> フォロワー
        </span>
      </div>
      <Link to={`/profile/${handle}`} className="btn btn-outline btn-sm">
        プロフィール全体を見る
      </Link>
    </section>
  );
}

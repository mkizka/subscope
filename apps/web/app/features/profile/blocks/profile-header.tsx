type Props = {
  displayName?: string;
  handle: string;
  avatarUrl?: string;
  bannerUrl?: string;
  description?: string;
  followsCount: number;
  followersCount: number;
};

export function ProfileHeader({
  displayName,
  handle,
  avatarUrl,
  bannerUrl,
  description,
  followsCount,
  followersCount,
}: Props) {
  return (
    <section className="border-b border-base-300">
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="h-32 bg-base-300" />
      )}
      <div className="flex flex-col gap-2 px-4 pb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="
              -mt-10 size-20 rounded-full border-4 border-base-100 object-cover
            "
          />
        ) : (
          <div
            className="
              -mt-10 size-20 rounded-full border-4 border-base-100 bg-base-300
            "
          />
        )}
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
          <span>
            <b>{followsCount}</b> フォロー
          </span>
          <span>
            <b>{followersCount}</b> フォロワー
          </span>
        </div>
      </div>
    </section>
  );
}

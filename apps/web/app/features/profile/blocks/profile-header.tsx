type Props = {
  displayName?: string;
  handle: string;
  avatarUrl?: string;
  followsCount: number;
  followersCount: number;
};

export function ProfileHeader({
  displayName,
  handle,
  avatarUrl,
  followsCount,
  followersCount,
}: Props) {
  return (
    <section className="flex items-center gap-4 border-b border-base-300 p-4">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-16 rounded-full object-cover"
        />
      ) : (
        <div className="size-16 rounded-full bg-base-300" />
      )}
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold">{displayName || handle}</h1>
        <p className="truncate text-sm text-base-content/60">@{handle}</p>
        <div className="mt-1 flex gap-4 text-sm">
          <span>{followsCount} フォロー</span>
          <span>{followersCount} フォロワー</span>
        </div>
      </div>
    </section>
  );
}

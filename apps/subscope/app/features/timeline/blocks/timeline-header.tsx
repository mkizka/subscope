type Props = {
  avatarUrl?: string;
  handle?: string;
};

export function TimelineHeader({ avatarUrl, handle }: Props) {
  return (
    <header
      className="
        fixed top-0 z-10 flex h-12 w-full items-center justify-between border-b
        bg-background px-4
      "
    >
      <span className="text-lg font-bold">Subscope</span>
      <div className="flex items-center gap-2">
        {handle && (
          <span className="text-sm text-muted-foreground">@{handle}</span>
        )}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="size-8 rounded-full bg-muted" />
        )}
      </div>
    </header>
  );
}

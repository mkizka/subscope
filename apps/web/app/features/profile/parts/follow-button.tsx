type Props = {
  following: boolean;
  busy?: boolean;
  onClick: () => void;
};

export function FollowButton({ following, busy, onClick }: Props) {
  return (
    <button
      type="button"
      aria-disabled={busy}
      className={`
        rounded-full px-4 py-1.5 text-sm font-bold
        ${
          following
            ? `
              border border-line
              hover:bg-surface-2
            `
            : "bg-brand text-on-brand"
        }
      `}
      onClick={onClick}
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}

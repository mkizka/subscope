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
        btn btn-sm
        ${following ? "btn-outline" : "btn-primary"}
      `}
      onClick={onClick}
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}

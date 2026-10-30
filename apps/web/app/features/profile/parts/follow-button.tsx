type Props = {
  following: boolean;
  onClick: () => void;
};

export function FollowButton({ following, onClick }: Props) {
  return (
    <button
      type="button"
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

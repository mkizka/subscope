import { Button } from "@/app/components/ui/button";

type Props = {
  following: boolean;
  busy?: boolean;
  onClick: () => void;
};

export function FollowButton({ following, busy, onClick }: Props) {
  return (
    <Button
      variant={following ? "secondary" : "primary"}
      size="sm"
      aria-disabled={busy}
      onClick={onClick}
    >
      {following ? "フォロー中" : "フォロー"}
    </Button>
  );
}

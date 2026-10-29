import {
  HeartIcon,
  type LucideIcon,
  MessageCircleIcon,
  QuoteIcon,
  RepeatIcon,
} from "lucide-react";

type Props = {
  liked: boolean;
  reposted: boolean;
  onLike: () => void;
  onRepost: () => void;
  onReply: () => void;
  onQuote: () => void;
};

function ToggleButton(props: {
  label: string;
  Icon: LucideIcon;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      aria-pressed={props.pressed}
      className={`
        btn join-item btn-square btn-ghost btn-sm
        ${props.pressed ? "text-primary" : ""}
      `}
      onClick={props.onClick}
    >
      <props.Icon className="size-4" />
    </button>
  );
}

export function PostToolbar({
  liked,
  reposted,
  onLike,
  onRepost,
  onReply,
  onQuote,
}: Props) {
  return (
    <div
      className="
        absolute top-1 right-2 join hidden rounded-box border border-base-300
        bg-base-100 shadow-sm
        group-focus-within:flex
        group-hover:flex
      "
    >
      <ToggleButton label="返信" Icon={MessageCircleIcon} onClick={onReply} />
      <ToggleButton
        label="リポスト"
        Icon={RepeatIcon}
        pressed={reposted}
        onClick={onRepost}
      />
      <ToggleButton label="引用" Icon={QuoteIcon} onClick={onQuote} />
      <ToggleButton
        label="いいね"
        Icon={HeartIcon}
        pressed={liked}
        onClick={onLike}
      />
    </div>
  );
}

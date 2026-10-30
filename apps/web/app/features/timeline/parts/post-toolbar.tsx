import {
  HeartIcon,
  type LucideIcon,
  MessageCircleIcon,
  QuoteIcon,
  RepeatIcon,
} from "lucide-react";

type Props = {
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
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
  count?: number;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      aria-pressed={props.pressed}
      className={`
        btn gap-1 btn-ghost px-2 font-normal btn-sm
        ${props.pressed ? "text-primary" : "text-base-content/70"}
      `}
      onClick={props.onClick}
    >
      <props.Icon className="size-4" />
      {!!props.count && (
        <span title={`${props.count}件の${props.label}`}>{props.count}</span>
      )}
    </button>
  );
}

export function PostToolbar({
  replyCount,
  repostCount,
  likeCount,
  liked,
  reposted,
  onLike,
  onRepost,
  onReply,
  onQuote,
}: Props) {
  return (
    <div className="relative -ml-2 flex gap-2">
      <ToggleButton
        label="返信"
        Icon={MessageCircleIcon}
        count={replyCount}
        onClick={onReply}
      />
      <ToggleButton
        label="リポスト"
        Icon={RepeatIcon}
        count={repostCount}
        pressed={reposted}
        onClick={onRepost}
      />
      <ToggleButton label="引用" Icon={QuoteIcon} onClick={onQuote} />
      <ToggleButton
        label="いいね"
        Icon={HeartIcon}
        count={likeCount}
        pressed={liked}
        onClick={onLike}
      />
    </div>
  );
}

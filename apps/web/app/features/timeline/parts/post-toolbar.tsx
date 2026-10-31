import {
  HeartIcon,
  type LucideIcon,
  MessageCircleIcon,
  QuoteIcon,
  RepeatIcon,
  Trash2Icon,
} from "lucide-react";

import { ConfirmDialog } from "@/app/components/confirm-dialog";

type Props = {
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  liked: boolean;
  reposted: boolean;
  likeBusy?: boolean;
  repostBusy?: boolean;
  deleteBusy?: boolean;
  onLike: () => void;
  onRepost: () => void;
  onReply: () => void;
  onQuote: () => void;
  onDelete?: () => void;
};

function ToggleButton(props: {
  label: string;
  Icon: LucideIcon;
  count?: number;
  pressed?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      aria-pressed={props.pressed}
      aria-disabled={props.busy}
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
  likeBusy,
  repostBusy,
  deleteBusy,
  onLike,
  onRepost,
  onReply,
  onQuote,
  onDelete,
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
        busy={repostBusy}
        onClick={onRepost}
      />
      <ToggleButton label="引用" Icon={QuoteIcon} onClick={onQuote} />
      <ToggleButton
        label="いいね"
        Icon={HeartIcon}
        count={likeCount}
        pressed={liked}
        busy={likeBusy}
        onClick={onLike}
      />
      {onDelete && (
        <ConfirmDialog
          title="投稿を削除"
          description="この投稿を削除しますか？"
          confirmLabel="削除"
          danger
          onConfirm={onDelete}
        >
          {(open) => (
            <ToggleButton
              label="削除"
              Icon={Trash2Icon}
              busy={deleteBusy}
              onClick={() => !deleteBusy && open()}
            />
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

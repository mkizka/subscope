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
        inline-flex h-10 items-center gap-1 rounded-full px-2 text-label
        hover:bg-surface-2
        aria-disabled:cursor-not-allowed
        ${props.pressed ? "text-brand" : "text-muted"}
      `}
      onClick={props.onClick}
    >
      <props.Icon className="size-5" />
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
    <div className="relative mt-1 -ml-2 flex gap-8">
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

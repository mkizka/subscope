import {
  EllipsisIcon,
  HeartIcon,
  LinkIcon,
  type LucideIcon,
  MessageCircleIcon,
  QuoteIcon,
  RepeatIcon,
  Trash2Icon,
} from "lucide-react";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { Menu, menuItemClass } from "@/app/components/ui/menu";

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
  onCopyLink: () => void;
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
        inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full
        px-2 text-label
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
  onCopyLink,
  onDelete,
}: Props) {
  return (
    <div className="relative -ml-2 flex justify-between">
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
      <ConfirmDialog
        title="投稿を削除"
        description="この投稿を削除しますか？"
        confirmLabel="削除"
        danger
        onConfirm={() => onDelete?.()}
      >
        {(open) => (
          <Menu
            label="投稿のメニュー"
            trigger={<EllipsisIcon className="size-5" />}
          >
            <button
              type="button"
              className={menuItemClass}
              onClick={onCopyLink}
            >
              <LinkIcon className="size-4" />
              リンクをコピー
            </button>
            {onDelete && (
              <button
                type="button"
                className={`
                  ${menuItemClass}
                  text-danger
                `}
                disabled={deleteBusy}
                onClick={open}
              >
                <Trash2Icon className="size-4" />
                削除
              </button>
            )}
          </Menu>
        )}
      </ConfirmDialog>
    </div>
  );
}

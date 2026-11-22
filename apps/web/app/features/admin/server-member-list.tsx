import { clsx } from "clsx";
import { BanIcon, EllipsisIcon, ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { AccountsSkeleton } from "@/app/components/rows-skeleton";
import { Avatar } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Menu, menuItemClass } from "@/app/components/ui/menu";
import { formatDate } from "@/app/lib/format-date";

type Account = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
};

export type ServerMember = Account & {
  isAdmin: boolean;
  registeredAt: string;
  backfillStatus: string;
};

function BackfillBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge>同期済み</Badge>;
  if (status === "error") return <Badge variant="danger">同期エラー</Badge>;
  return <Badge>同期中</Badge>;
}

const rowClass =
  "flex items-center gap-3 border-b border-line px-4 py-3 hover:bg-surface-2";

function ProfileCell({
  account,
  children,
}: {
  account: Account;
  children?: ReactNode;
}) {
  const profileId =
    account.handle === "handle.invalid" ? account.did : account.handle;
  return (
    <Link
      to={`/${profileId}`}
      className="flex min-w-0 flex-1 items-center gap-3"
    >
      <Avatar src={account.avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-body font-bold">
          {account.displayName ?? account.handle}
        </div>
        <div className="truncate text-label text-muted" title={account.did}>
          @{account.handle}
        </div>
        {children}
      </div>
    </Link>
  );
}

type Props = {
  serverMembers: ServerMember[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  onGrantAdmin?: (did: string) => void;
  grantingDid?: string | null;
  onBan?: (did: string) => void;
  banningDid?: string | null;
  addMemberButton?: ReactNode;
};

export function ServerMemberList({
  serverMembers,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  hasNextPage,
  onGrantAdmin,
  grantingDid,
  onBan,
  banningDid,
  addMemberButton,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <h1 className="text-title">アカウント管理</h1>
        {addMemberButton}
      </div>
      {!isLoading && serverMembers.length === 0 && (
        <p className="py-8 text-center text-label text-muted">
          メンバーはまだありません
        </p>
      )}
      {isLoading && <AccountsSkeleton />}
      <ul>
        {serverMembers.map((serverMember) => (
          <li key={serverMember.did} className={rowClass}>
            <ProfileCell account={serverMember}>
              <div className="flex items-center gap-2 text-caption text-muted">
                <BackfillBadge status={serverMember.backfillStatus} />
                {formatDate(serverMember.registeredAt)} 登録
              </div>
            </ProfileCell>
            {serverMember.isAdmin ? (
              <Badge>管理者</Badge>
            ) : (
              <ConfirmDialog
                title={`@${serverMember.handle} を管理者にしますか？`}
                description="管理画面のすべての操作ができるようになります。"
                confirmLabel="管理者にする"
                onConfirm={() => onGrantAdmin?.(serverMember.did)}
              >
                {(openGrantAdmin) => (
                  <ConfirmDialog
                    title={`@${serverMember.handle} のサーバー登録を停止しますか？`}
                    description="サーバー登録が停止され、招待コードでも再登録できなくなります。"
                    confirmLabel="停止する"
                    danger
                    onConfirm={() => onBan?.(serverMember.did)}
                  >
                    {(openBan) => (
                      <Menu
                        label="操作"
                        trigger={<EllipsisIcon className="size-4" />}
                      >
                        <button
                          type="button"
                          className={menuItemClass}
                          disabled={grantingDid === serverMember.did}
                          onClick={openGrantAdmin}
                        >
                          <ShieldIcon className="size-4" />
                          管理者にする
                        </button>
                        <button
                          type="button"
                          className={clsx(menuItemClass, "text-danger")}
                          disabled={banningDid === serverMember.did}
                          onClick={openBan}
                        >
                          <BanIcon className="size-4" />
                          サーバー登録を停止する
                        </button>
                      </Menu>
                    )}
                  </ConfirmDialog>
                )}
              </ConfirmDialog>
            )}
          </li>
        ))}
      </ul>
      {isFetchingNextPage && (
        <p className="py-4 text-center text-label text-muted">読み込み中...</p>
      )}
      {onLoadMore && (
        <InfiniteScrollTrigger
          onIntersect={onLoadMore}
          enabled={hasNextPage && !isFetchingNextPage}
        />
      )}
    </>
  );
}

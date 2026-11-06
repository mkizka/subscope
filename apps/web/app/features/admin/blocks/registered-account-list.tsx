import { clsx } from "clsx";
import { BanIcon, EllipsisIcon, ShieldIcon, UndoIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { Avatar } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Menu, menuItemClass } from "@/app/components/ui/menu";
import { Tabs } from "@/app/components/ui/tabs";
import { formatDate } from "@/app/lib/format-date";

export type BannedAccount = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
};

export type RegisteredAccount = BannedAccount & {
  isAdmin: boolean;
  registeredAt: string;
  backfillStatus: string;
};

function BackfillBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge>同期済み</Badge>;
  if (status === "error") return <Badge variant="danger">同期エラー</Badge>;
  return <Badge>同期中</Badge>;
}

const rowClass = "flex items-center gap-3 border-b border-line px-4 py-3";

export type RegisteredAccountTab = "registeredAccounts" | "banned";

function ProfileCell({
  account,
  children,
}: {
  account: BannedAccount;
  children?: ReactNode;
}) {
  return (
    <>
      <Avatar src={account.avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">
          {account.displayName ?? account.handle}
        </div>
        <div className="truncate text-label text-muted" title={account.did}>
          @{account.handle}
        </div>
        {children}
      </div>
    </>
  );
}

type Props = {
  tab?: RegisteredAccountTab;
  registeredAccounts: RegisteredAccount[];
  bannedAccounts?: BannedAccount[];
  total?: number;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  onGrantAdmin?: (did: string) => void;
  grantingDid?: string | null;
  onBan?: (did: string) => void;
  banningDid?: string | null;
  onUnban?: (did: string) => void;
  unbanningDid?: string | null;
};

export function RegisteredAccountList({
  tab = "registeredAccounts",
  registeredAccounts,
  bannedAccounts = [],
  total,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  hasNextPage,
  onGrantAdmin,
  grantingDid,
  onBan,
  banningDid,
  onUnban,
  unbanningDid,
}: Props) {
  const isEmpty =
    tab === "banned"
      ? bannedAccounts.length === 0
      : registeredAccounts.length === 0;
  return (
    <>
      <div className="sticky top-0 bg-surface">
        <div className="flex items-baseline gap-2 px-4 py-3">
          <h1 className="text-title">アカウント管理</h1>
          {total !== undefined && (
            <span className="text-label text-muted">{total}人</span>
          )}
        </div>
        <Tabs
          tabs={[
            {
              to: "/admin/registered-accounts",
              label: "登録アカウント",
              selected: tab === "registeredAccounts",
            },
            {
              to: "/admin/registered-accounts?tab=banned",
              label: "停止中",
              selected: tab === "banned",
            },
          ]}
        />
      </div>
      {!isLoading && isEmpty && (
        <p className="py-8 text-center text-label text-muted">
          {tab === "banned"
            ? "停止中のアカウントはありません"
            : "登録アカウントはまだありません"}
        </p>
      )}
      {isLoading && (
        <p className="py-8 text-center text-label text-muted">読み込み中...</p>
      )}
      <ul>
        {tab === "banned" &&
          bannedAccounts.map((account) => (
            <li key={account.did} className={rowClass}>
              <ProfileCell account={account} />
              <ConfirmDialog
                title={`@${account.handle} の登録を再開しますか？`}
                description="再開すると、招待コードで再登録できるようになります。"
                confirmLabel="再開する"
                onConfirm={() => onUnban?.(account.did)}
              >
                {(open) => (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={unbanningDid === account.did}
                    onClick={open}
                  >
                    {unbanningDid !== account.did && (
                      <UndoIcon className="size-4" />
                    )}
                    登録を再開する
                  </Button>
                )}
              </ConfirmDialog>
            </li>
          ))}
        {tab === "registeredAccounts" &&
          registeredAccounts.map((registeredAccount) => (
            <li key={registeredAccount.did} className={rowClass}>
              <ProfileCell account={registeredAccount}>
                <div className="flex items-center gap-2 text-caption text-muted">
                  <BackfillBadge status={registeredAccount.backfillStatus} />
                  {formatDate(registeredAccount.registeredAt)} 登録
                </div>
              </ProfileCell>
              {registeredAccount.isAdmin ? (
                <Badge>管理者</Badge>
              ) : (
                <ConfirmDialog
                  title={`@${registeredAccount.handle} を管理者にしますか？`}
                  description="管理画面のすべての操作ができるようになります。"
                  confirmLabel="管理者にする"
                  onConfirm={() => onGrantAdmin?.(registeredAccount.did)}
                >
                  {(openGrantAdmin) => (
                    <ConfirmDialog
                      title={`@${registeredAccount.handle} のサーバー登録を停止しますか？`}
                      description="サーバー登録が停止され、招待コードでも再登録できなくなります。"
                      confirmLabel="停止する"
                      danger
                      onConfirm={() => onBan?.(registeredAccount.did)}
                    >
                      {(openBan) => (
                        <Menu
                          label="操作"
                          trigger={<EllipsisIcon className="size-4" />}
                        >
                          <button
                            type="button"
                            className={menuItemClass}
                            disabled={grantingDid === registeredAccount.did}
                            onClick={openGrantAdmin}
                          >
                            <ShieldIcon className="size-4" />
                            管理者にする
                          </button>
                          <button
                            type="button"
                            className={clsx(menuItemClass, "text-danger")}
                            disabled={banningDid === registeredAccount.did}
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

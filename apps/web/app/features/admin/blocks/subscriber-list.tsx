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

export type BannedActor = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
};

export type Subscriber = BannedActor & {
  isAdmin: boolean;
  subscribedAt: string;
};

const rowClass = "flex items-center gap-3 border-b border-line px-4 py-3";

export type SubscriberTab = "subscribers" | "banned";

function ProfileCell({
  actor,
  children,
}: {
  actor: BannedActor;
  children?: ReactNode;
}) {
  return (
    <>
      <Avatar src={actor.avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">
          {actor.displayName ?? actor.handle}
        </div>
        <div className="truncate text-label text-muted" title={actor.did}>
          @{actor.handle}
        </div>
        {children}
      </div>
    </>
  );
}

type Props = {
  tab?: SubscriberTab;
  subscribers: Subscriber[];
  bannedActors?: BannedActor[];
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

export function SubscriberList({
  tab = "subscribers",
  subscribers,
  bannedActors = [],
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
    tab === "banned" ? bannedActors.length === 0 : subscribers.length === 0;
  return (
    <>
      <div className="sticky top-0 bg-surface">
        <div className="flex items-baseline gap-2 px-4 py-3">
          <h1 className="text-title">登録ユーザー</h1>
          {total !== undefined && (
            <span className="text-label text-muted">{total}人</span>
          )}
        </div>
        <Tabs
          tabs={[
            {
              to: "/admin/subscribers",
              label: "登録ユーザー",
              selected: tab === "subscribers",
            },
            {
              to: "/admin/subscribers?tab=banned",
              label: "BAN済み",
              selected: tab === "banned",
            },
          ]}
        />
      </div>
      {!isLoading && isEmpty && (
        <p className="py-8 text-center text-label text-muted">
          {tab === "banned"
            ? "BAN済みのアカウントはありません"
            : "登録アカウントはまだありません"}
        </p>
      )}
      {isLoading && (
        <p className="py-8 text-center text-label text-muted">読み込み中...</p>
      )}
      <ul>
        {tab === "banned" &&
          bannedActors.map((actor) => (
            <li key={actor.did} className={rowClass}>
              <ProfileCell actor={actor} />
              <ConfirmDialog
                title={`@${actor.handle} のBANを解除しますか？`}
                description="解除すると、招待コードで再登録できるようになります。"
                confirmLabel="解除する"
                onConfirm={() => onUnban?.(actor.did)}
              >
                {(open) => (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={unbanningDid === actor.did}
                    onClick={open}
                  >
                    {unbanningDid !== actor.did && (
                      <UndoIcon className="size-4" />
                    )}
                    解除
                  </Button>
                )}
              </ConfirmDialog>
            </li>
          ))}
        {tab === "subscribers" &&
          subscribers.map((subscriber) => (
            <li key={subscriber.did} className={rowClass}>
              <ProfileCell actor={subscriber}>
                <div className="text-caption text-muted">
                  {formatDate(subscriber.subscribedAt)} 登録
                </div>
              </ProfileCell>
              {subscriber.isAdmin ? (
                <Badge>管理者</Badge>
              ) : (
                <ConfirmDialog
                  title={`@${subscriber.handle} を管理者にしますか？`}
                  description="管理画面のすべての操作ができるようになります。"
                  confirmLabel="管理者にする"
                  onConfirm={() => onGrantAdmin?.(subscriber.did)}
                >
                  {(openGrantAdmin) => (
                    <ConfirmDialog
                      title={`@${subscriber.handle} をBANしますか？`}
                      description="登録が解除され、招待コードでも再登録できなくなります。"
                      confirmLabel="BANする"
                      danger
                      onConfirm={() => onBan?.(subscriber.did)}
                    >
                      {(openBan) => (
                        <Menu
                          label="操作"
                          trigger={<EllipsisIcon className="size-4" />}
                        >
                          <button
                            type="button"
                            className={menuItemClass}
                            disabled={grantingDid === subscriber.did}
                            onClick={openGrantAdmin}
                          >
                            <ShieldIcon className="size-4" />
                            管理者にする
                          </button>
                          <button
                            type="button"
                            className={clsx(menuItemClass, "text-danger")}
                            disabled={banningDid === subscriber.did}
                            onClick={openBan}
                          >
                            <BanIcon className="size-4" />
                            BAN
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

import { BanIcon, EllipsisIcon, ShieldIcon, UndoIcon } from "lucide-react";
import type { ReactNode } from "react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { ConfirmDialog } from "@/app/features/admin/parts/confirm-dialog";
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
      {actor.avatar ? (
        <img src={actor.avatar} alt="" className="size-10 rounded-full" />
      ) : (
        <div className="size-10 rounded-full bg-base-200" />
      )}
      <div className="min-w-0">
        <div className="truncate font-medium">
          {actor.displayName ?? actor.handle}
        </div>
        <div
          className="truncate text-sm text-base-content/70"
          title={actor.did}
        >
          @{actor.handle}
        </div>
        {children}
      </div>
    </>
  );
}

type Props = {
  tab?: SubscriberTab;
  onTabChange?: (tab: SubscriberTab) => void;
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
  onTabChange,
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
      <div className="flex items-baseline gap-2 px-6 pt-6 pb-3">
        <h1 className="text-xl font-bold">登録ユーザー</h1>
        {total !== undefined && (
          <span className="text-sm text-base-content/70">{total}人</span>
        )}
      </div>
      <div role="tablist" className="tabs tabs-border mx-4">
        {(
          [
            ["subscribers", "登録ユーザー"],
            ["banned", "BAN済み"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "tab tab-active" : "tab"}
            onClick={() => onTabChange?.(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {!isLoading && isEmpty && (
        <p className="py-8 text-center">
          {tab === "banned"
            ? "BAN済みのアカウントはありません"
            : "登録アカウントはまだありません"}
        </p>
      )}
      {isLoading && <p className="py-8 text-center">読み込み中...</p>}
      <ul className="list">
        {tab === "banned" &&
          bannedActors.map((actor) => (
            <li key={actor.did} className="list-row items-center">
              <ProfileCell actor={actor} />
              <ConfirmDialog
                title={`@${actor.handle} のBANを解除しますか？`}
                description="解除すると、招待コードで再登録できるようになります。"
                confirmLabel="解除する"
                onConfirm={() => onUnban?.(actor.did)}
              >
                {(open) => (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={unbanningDid === actor.did}
                    onClick={open}
                  >
                    <UndoIcon className="size-4" />
                    解除
                  </button>
                )}
              </ConfirmDialog>
            </li>
          ))}
        {tab === "subscribers" &&
          subscribers.map((subscriber) => (
            <li key={subscriber.did} className="list-row items-center">
              <ProfileCell actor={subscriber}>
                <div className="text-xs text-base-content/70">
                  {formatDate(subscriber.subscribedAt)} 登録
                </div>
              </ProfileCell>
              {subscriber.isAdmin ? (
                <span className="badge badge-soft badge-sm badge-primary">
                  <ShieldIcon className="size-3" />
                  管理者
                </span>
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
                        <div className="dropdown dropdown-end">
                          <button
                            type="button"
                            className="btn btn-square btn-ghost btn-sm"
                            aria-label="操作"
                          >
                            <EllipsisIcon className="size-4" />
                          </button>
                          <ul
                            className="
                              menu dropdown-content z-10 w-44 rounded-box border
                              border-base-300 bg-base-100 p-2 shadow-sm
                            "
                          >
                            <li>
                              <button
                                type="button"
                                disabled={grantingDid === subscriber.did}
                                onClick={openGrantAdmin}
                              >
                                <ShieldIcon className="size-4" />
                                管理者にする
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="text-error"
                                disabled={banningDid === subscriber.did}
                                onClick={openBan}
                              >
                                <BanIcon className="size-4" />
                                BAN
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </ConfirmDialog>
                  )}
                </ConfirmDialog>
              )}
            </li>
          ))}
      </ul>
      {isFetchingNextPage && (
        <p className="mt-4 text-center text-sm text-base-content/70">
          読み込み中...
        </p>
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

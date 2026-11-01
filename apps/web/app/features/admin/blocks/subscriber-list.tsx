import { BanIcon, EllipsisIcon, ShieldIcon, UndoIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
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
      {actor.avatar ? (
        <img
          src={actor.avatar}
          alt=""
          className="size-10 shrink-0 rounded-full"
        />
      ) : (
        <div className="size-10 shrink-0 rounded-full bg-surface-2" />
      )}
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
      <div className="flex items-baseline gap-2 px-4 py-3">
        <h1 className="text-title">登録ユーザー</h1>
        {total !== undefined && (
          <span className="text-label text-muted">{total}人</span>
        )}
      </div>
      <div role="tablist" className="flex border-b border-line">
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
            className="
              flex-1 py-2.5 text-label text-muted
              aria-selected:font-bold aria-selected:text-ink
              aria-selected:shadow-[inset_0_-3px_0_var(--color-brand)]
            "
            onClick={() => onTabChange?.(value)}
          >
            {label}
          </button>
        ))}
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
                  <button
                    type="button"
                    className="
                      inline-flex items-center gap-1 rounded-full border
                      border-line px-3 py-1 text-label
                      hover:bg-surface-2
                      disabled:opacity-50
                    "
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
            <li key={subscriber.did} className={rowClass}>
              <ProfileCell actor={subscriber}>
                <div className="text-caption text-muted">
                  {formatDate(subscriber.subscribedAt)} 登録
                </div>
              </ProfileCell>
              {subscriber.isAdmin ? (
                <span
                  className="
                    inline-flex shrink-0 items-center gap-1 rounded-full
                    bg-brand-soft px-2.5 py-0.5 text-caption font-bold
                    text-brand
                  "
                >
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
                        <div className="group relative">
                          <button
                            type="button"
                            className="
                              inline-flex size-8 items-center justify-center
                              rounded-full
                              hover:bg-surface-2
                            "
                            aria-label="操作"
                          >
                            <EllipsisIcon className="size-4" />
                          </button>
                          <ul
                            className="
                              invisible absolute right-0 z-10 w-44
                              rounded-[14px] border border-line bg-surface p-1.5
                              group-focus-within:visible
                              [&_button]:flex [&_button]:w-full
                              [&_button]:items-center [&_button]:gap-2
                              [&_button]:rounded-[10px] [&_button]:px-3
                              [&_button]:py-2 [&_button]:text-label
                              [&_button:disabled]:opacity-50
                              [&_button:hover]:bg-surface-2
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
                                className="text-danger"
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

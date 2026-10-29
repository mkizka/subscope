import { EllipsisIcon, ShieldIcon } from "lucide-react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";

export type Subscriber = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  isAdmin: boolean;
};

type Props = {
  subscribers: Subscriber[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  onGrantAdmin?: (did: string) => void;
  grantingDid?: string | null;
};

export function SubscriberList({
  subscribers,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  hasNextPage,
  onGrantAdmin,
  grantingDid,
}: Props) {
  return (
    <>
      <div className="px-6 pt-6 pb-3">
        <h1 className="text-xl font-bold">登録ユーザー</h1>
      </div>
      {!isLoading && subscribers.length === 0 && (
        <p className="py-8 text-center">登録アカウントはまだありません</p>
      )}
      {isLoading && <p className="py-8 text-center">読み込み中...</p>}
      <ul className="list">
        {subscribers.map((subscriber) => (
          <li key={subscriber.did} className="list-row items-center">
            {subscriber.avatar ? (
              <img
                src={subscriber.avatar}
                alt=""
                className="size-10 rounded-full"
              />
            ) : (
              <div className="size-10 rounded-full bg-base-200" />
            )}
            <div className="min-w-0">
              <div className="truncate font-medium">
                {subscriber.displayName ?? subscriber.handle}
              </div>
              <div
                className="truncate text-sm text-base-content/70"
                title={subscriber.did}
              >
                @{subscriber.handle}
              </div>
            </div>
            {subscriber.isAdmin ? (
              <span className="badge badge-soft badge-sm badge-primary">
                <ShieldIcon className="size-3" />
                管理者
              </span>
            ) : (
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
                      onClick={() => {
                        if (
                          window.confirm(
                            `@${subscriber.handle} を管理者にしますか？`,
                          )
                        ) {
                          onGrantAdmin?.(subscriber.did);
                        }
                      }}
                    >
                      <ShieldIcon className="size-4" />
                      管理者にする
                    </button>
                  </li>
                </ul>
              </div>
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

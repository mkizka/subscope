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

export function SubscriberTable({
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
      <div className="card border border-base-300 bg-base-100">
        <h2 className="card-title p-6 pb-2 text-2xl">登録アカウント一覧</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ユーザー</th>
                <th>DID</th>
                <th>権限</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && subscribers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center">
                    登録アカウントはまだありません
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={3} className="py-8 text-center">
                    読み込み中...
                  </td>
                </tr>
              )}
              {subscribers.map((subscriber) => (
                <tr key={subscriber.did}>
                  <td>
                    <div className="flex items-center gap-3">
                      {subscriber.avatar ? (
                        <img
                          src={subscriber.avatar}
                          alt=""
                          className="size-8 rounded-full"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-base-200" />
                      )}
                      <div className="flex flex-col">
                        {subscriber.displayName && (
                          <span className="text-sm font-medium">
                            {subscriber.displayName}
                          </span>
                        )}
                        <span className="text-sm text-base-content/70">
                          @{subscriber.handle}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{subscriber.did}</td>
                  <td>
                    {subscriber.isAdmin ? (
                      <span className="badge badge-primary">管理者</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm"
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
                        管理者にする
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

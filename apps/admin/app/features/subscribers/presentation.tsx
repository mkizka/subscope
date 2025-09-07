import type { AppBskyActorDefs } from "@repo/client/api";

import { HeaderCard } from "~/components/header-card";
import { InfiniteScroll } from "~/components/infinite-scroll";

type Subscriber = AppBskyActorDefs.ProfileView;

function SubscribersList({ subscribers }: { subscribers?: Subscriber[] }) {
  if (!subscribers) return null;

  if (subscribers.length === 0) {
    return <li className="text-center p-6">サブスクライバーがいません</li>;
  }

  return subscribers.map((subscriber) => (
    <li key={subscriber.did} className="list-row p-6">
      <div className="avatar">
        <div className="size-10 rounded-full bg-base-300">
          {subscriber.avatar ? (
            <img src={subscriber.avatar} alt={subscriber.displayName} />
          ) : (
            <div className="flex items-center justify-center size-full">
              <span className="icon-[tabler--user] size-6 text-base-content/50"></span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="font-bold truncate">
          {subscriber.displayName || subscriber.handle}
        </div>
        <div className="text-xs text-base-content/50 truncate">
          @{subscriber.handle}
        </div>
        <div className="text-xs text-base-content/50 truncate">
          at://{subscriber.did}
        </div>
      </div>
    </li>
  ));
}

function ErrorMessage({ reload }: { reload: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <p className="text-error">データの読み込みに失敗しました</p>
      <button className="btn btn-secondary btn-sm" onClick={reload}>
        再試行
      </button>
    </div>
  );
}

type SubscribersPresentationProps = {
  subscribers?: Subscriber[];
  error: Error | null;
  reload: () => void;
  loadMore: () => void;
  hasMore: boolean;
  isFetching: boolean;
};

export function SubscribersPresentation({
  subscribers,
  error,
  reload,
  loadMore,
  hasMore,
  isFetching,
}: SubscribersPresentationProps) {
  return (
    <div className="grid gap-2">
      <HeaderCard showBackButton>サブスクライバー</HeaderCard>
      <ul className="list rounded-box bg-base-100 shadow-sm">
        {error ? (
          <ErrorMessage reload={reload} />
        ) : (
          <SubscribersList subscribers={subscribers} />
        )}
        <InfiniteScroll
          className="p-6"
          onIntersect={loadMore}
          hasMore={hasMore}
          isLoading={isFetching}
        />
      </ul>
    </div>
  );
}

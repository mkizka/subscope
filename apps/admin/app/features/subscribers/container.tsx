import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchSubscribers } from "./fetcher";
import { SubscribersPresentation } from "./presentation";

export function SubscribersContainer() {
  const {
    data: subscribers,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isPending,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["subscribers"],
    queryFn: fetchSubscribers,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) => data.pages.flatMap((page) => page.subscribers),
    initialPageParam: undefined,
    refetchOnWindowFocus: false,
  });

  // 初期描画時からspinnerを出しておきたいので、初回読み込み(isPending=true)の時もtrueにする
  const hasMore = isPending || hasNextPage;
  const loadMore = () => fetchNextPage();
  const reload = () => refetch();

  return (
    <SubscribersPresentation
      subscribers={subscribers}
      error={error}
      reload={reload}
      loadMore={loadMore}
      hasMore={hasMore}
      isFetching={isFetching}
    />
  );
}

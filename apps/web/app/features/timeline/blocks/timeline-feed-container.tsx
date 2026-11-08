import { useInfiniteQuery } from "@tanstack/react-query";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.timeline";

import { TimelineFeed } from "./timeline-feed";

type TimelineResponse = Awaited<ReturnType<typeof loader>>["data"];

export function TimelineFeedContainer({ local }: { local: boolean }) {
  const name = local ? "local-timeline" : "timeline";
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching } =
    useInfiniteQuery({
      queryKey: [name],
      queryFn: ({ pageParam }) =>
        fetchJson<TimelineResponse>(
          `/api/${name}?${new URLSearchParams(pageParam ? { cursor: pageParam } : {})}`,
        ),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      refetchInterval: 60_000,
      throwOnError: true,
    });

  if (!data) {
    return <PostsSkeleton />;
  }
  return (
    <>
      {isRefetching && !isFetchingNextPage && (
        <div className="relative h-0">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
            <LoadingSpinner label="タイムラインを更新中" />
          </div>
        </div>
      )}
      <TimelineFeed posts={data.pages.flatMap((page) => page.posts)} />
      {hasNextPage && (
        <LoadingSpinner label="続きを読み込み中">
          <InfiniteScrollTrigger
            onIntersect={() => void fetchNextPage()}
            enabled={!isFetchingNextPage}
          />
        </LoadingSpinner>
      )}
    </>
  );
}

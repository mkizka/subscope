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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [name],
      queryFn: ({ pageParam }) =>
        fetchJson<TimelineResponse>(
          `/api/${name}?${new URLSearchParams(pageParam ? { cursor: pageParam } : {})}`,
        ),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      throwOnError: true,
    });

  if (!data) {
    return <PostsSkeleton />;
  }
  return (
    <>
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

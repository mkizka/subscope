import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.timeline";

import { TimelineFeed } from "./timeline-feed";

type TimelineResponse = Awaited<ReturnType<typeof loader>>["data"];

function Spinner({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div role="status" aria-label={label} className="flex justify-center py-6">
      <LoaderCircle className="size-6 animate-spin text-muted" />
      {children}
    </div>
  );
}

export function TimelineFeedContainer() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["timeline"],
      queryFn: ({ pageParam }) =>
        fetchJson<TimelineResponse>(
          `/api/timeline?${new URLSearchParams(pageParam ? { cursor: pageParam } : {})}`,
        ),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      throwOnError: true,
    });

  if (!data) {
    return <Spinner label="読み込み中" />;
  }
  return (
    <>
      <TimelineFeed posts={data.pages.flatMap((page) => page.posts)} />
      {hasNextPage && (
        <Spinner label="続きを読み込み中">
          <InfiniteScrollTrigger
            onIntersect={() => void fetchNextPage()}
            enabled={!isFetchingNextPage}
          />
        </Spinner>
      )}
    </>
  );
}

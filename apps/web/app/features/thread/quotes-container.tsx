import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { TimelineFeed } from "@/app/features/timeline/timeline-feed";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.quotes";

type QuotesResponse = Awaited<ReturnType<typeof loader>>["data"];

type Props = {
  handle: string;
  rkey: string;
};

export function QuotesContainer({ handle, rkey }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["quotes", handle, rkey],
      queryFn: ({ pageParam }) =>
        fetchJson<QuotesResponse>(
          `/api/quotes?${new URLSearchParams({ handle, rkey, ...(pageParam && { cursor: pageParam }) })}`,
        ),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      throwOnError: true,
    });

  const posts = data?.pages.flatMap((page) => page.posts);
  return (
    <section aria-label="引用">
      <header
        className="
          sticky top-0 z-sticky flex items-center gap-2 border-b border-line
          bg-surface px-4 py-3
        "
      >
        <Link
          to={`/${handle}/post/${rkey}`}
          aria-label="戻る"
          className="text-muted"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <h1 className="text-title">引用</h1>
      </header>
      {!posts ? (
        <PostsSkeleton />
      ) : posts.length === 0 ? (
        <p className="py-8 text-center text-label text-muted">
          まだ引用されていません
        </p>
      ) : (
        <TimelineFeed posts={posts} />
      )}
      {hasNextPage && (
        <LoadingSpinner label="続きを読み込み中">
          <InfiniteScrollTrigger
            onIntersect={() => void fetchNextPage()}
            enabled={!isFetchingNextPage}
          />
        </LoadingSpinner>
      )}
    </section>
  );
}

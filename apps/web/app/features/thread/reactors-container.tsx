import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { AccountsSkeleton } from "@/app/components/rows-skeleton";
import { AccountList } from "@/app/features/account/account-list";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.reactors.$kind";

type ReactorsResponse = Awaited<ReturnType<typeof loader>>["data"];

const titles = { "liked-by": "いいね", "reposted-by": "リポスト" };
const emptyMessages = {
  "liked-by": "まだいいねされていません",
  "reposted-by": "まだリポストされていません",
};

type Props = {
  handle: string;
  rkey: string;
  kind: "liked-by" | "reposted-by";
};

export function ReactorsContainer({ handle, rkey, kind }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["reactors", kind, handle, rkey],
      queryFn: ({ pageParam }) =>
        fetchJson<ReactorsResponse>(
          `/api/reactors/${kind}?${new URLSearchParams({ handle, rkey, ...(pageParam && { cursor: pageParam }) })}`,
        ),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      throwOnError: true,
    });

  const accounts = data?.pages.flatMap((page) => page.accounts);
  return (
    <section aria-label={titles[kind]}>
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
        <h1 className="text-title">{titles[kind]}</h1>
      </header>
      {!accounts ? (
        <AccountsSkeleton />
      ) : accounts.length === 0 ? (
        <p className="py-8 text-center text-label text-muted">
          {emptyMessages[kind]}
        </p>
      ) : (
        <AccountList accounts={accounts} />
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

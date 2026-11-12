import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { AccountsSkeleton } from "@/app/components/rows-skeleton";
import { Tabs } from "@/app/components/ui/tabs";
import { AccountList } from "@/app/features/account/account-list";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.profile.$handle.$kind";

type FollowListResponse = Awaited<ReturnType<typeof loader>>["data"];

const titles = { follows: "フォロー", followers: "フォロワー" };
const emptyMessages = {
  follows: "フォローしているアカウントはありません",
  followers: "フォロワーはいません",
};
const filters = ["registered", "known"] as const;

type Props = {
  handle: string;
  kind: "follows" | "followers";
};

export function FollowListContainer({ handle, kind }: Props) {
  const filterParam = useSearchParams()[0].get("filter");
  const filter =
    kind === "followers"
      ? filters.find((value) => value === filterParam)
      : undefined;
  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["follow-list", handle, kind, filter ?? "all"],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams({
        ...(filter && { filter }),
        ...(pageParam && { cursor: pageParam }),
      }).toString();
      return fetchJson<FollowListResponse>(
        `/api/profile/${encodeURIComponent(handle)}/${kind}${query && `?${query}`}`,
      );
    },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    throwOnError: true,
  });
  const data = pages?.pages[0];
  const accounts = pages?.pages.flatMap((page) => page.accounts);

  const subject = data?.subject;
  return (
    <>
      <header className="flex items-center gap-2 border-b border-line p-4">
        <Link to={`/${handle}`} aria-label="戻る" className="text-muted">
          <ArrowLeftIcon className="size-5" />
        </Link>
        <h1 className="text-title">
          {subject ? `${subject.displayName || subject.handle}の` : ""}
          {titles[kind]}
        </h1>
      </header>
      {kind === "followers" && (
        <Tabs
          tabs={[
            { to: ".", label: "すべて", selected: !filter },
            {
              to: "?filter=known",
              label: "知り合い",
              selected: filter === "known",
            },
            {
              to: "?filter=registered",
              label: `メンバー${data?.registeredCount === undefined ? "" : ` ${data.registeredCount}`}`,
              selected: filter === "registered",
            },
          ]}
        />
      )}
      {!accounts ? (
        <AccountsSkeleton />
      ) : accounts.length === 0 ? (
        <p className="py-8 text-center text-label text-muted">
          {filter === "known"
            ? "知り合いのフォロワーはいません"
            : emptyMessages[kind]}
        </p>
      ) : (
        <>
          <AccountList accounts={accounts} />
          {hasNextPage && (
            <LoadingSpinner label="続きを読み込み中">
              <InfiniteScrollTrigger
                onIntersect={() => void fetchNextPage()}
                enabled={!isFetchingNextPage}
              />
            </LoadingSpinner>
          )}
        </>
      )}
    </>
  );
}

import { useQuery } from "@tanstack/react-query";

import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { AccountsSkeleton } from "@/app/components/rows-skeleton";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.search";

import { SearchResults } from "./search-results";

type SearchResponse = Awaited<ReturnType<typeof loader>>["data"];

type Props = {
  q: string;
  tab: "accounts" | "posts";
};

export function SearchResultsContainer({ q, tab }: Props) {
  const { data } = useQuery({
    queryKey: ["search", tab, q],
    queryFn: () =>
      fetchJson<SearchResponse>(
        `/api/search?${new URLSearchParams({ q, ...(tab === "posts" && { tab }) })}`,
      ),
    throwOnError: true,
  });

  if (!data) {
    return tab === "accounts" ? <AccountsSkeleton /> : <PostsSkeleton />;
  }
  return (
    <SearchResults tab={tab} accounts={data.accounts} posts={data.posts} />
  );
}

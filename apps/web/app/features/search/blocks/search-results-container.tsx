import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.search";

import { SearchResults } from "./search-results";

type SearchResponse = Awaited<ReturnType<typeof loader>>["data"];

type Props = {
  q: string;
  tab: "actors" | "posts";
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
    return (
      <div
        role="status"
        aria-label="読み込み中"
        className="flex justify-center py-6"
      >
        <LoaderCircle className="size-6 animate-spin text-muted" />
      </div>
    );
  }
  return <SearchResults tab={tab} actors={data.actors} posts={data.posts} />;
}

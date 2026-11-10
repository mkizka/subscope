import { parseWithZod } from "@conform-to/zod/v4";
import { useSearchParams } from "react-router";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import {
  SearchFormContainer,
  searchSchema,
} from "@/app/features/search/search-form-container";
import { SearchResultsContainer } from "@/app/features/search/search-results-container";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const submission = parseWithZod(searchParams, { schema: searchSchema });
  const { q, tab = "posts" as const } =
    submission.status === "success" ? submission.value : {};
  return (
    <ThreeColumnLayout hideSearch>
      <h1 className="border-b border-line p-4 text-title">検索</h1>
      <SearchFormContainer key={q} q={q} tab={tab} />
      <Tabs
        tabs={(
          [
            ["posts", "投稿", {}],
            ["accounts", "ユーザー", { tab: "accounts" }],
          ] as const
        ).map(([value, label, params]) => ({
          to: `?${new URLSearchParams({ ...(q && { q }), ...params })}`,
          label,
          selected: tab === value,
        }))}
      />
      {q ? (
        <SearchResultsContainer q={q} tab={tab} />
      ) : (
        <p className="p-6 text-center text-label text-muted">
          名前・ハンドル・投稿の本文から、このサーバーに保存されているアカウントと投稿を検索できます
        </p>
      )}
    </ThreeColumnLayout>
  );
}

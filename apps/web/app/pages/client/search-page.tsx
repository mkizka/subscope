import { parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import {
  SearchFormContainer,
  searchSchema,
} from "@/app/features/search/search-form-container";
import { SearchResultsContainer } from "@/app/features/search/search-results-container";

type Props = {
  defaultTab?: "posts" | "accounts";
};

export function SearchPage({ defaultTab = "posts" }: Props) {
  const [searchParams] = useSearchParams();
  const submission = parseWithZod(searchParams, { schema: searchSchema });
  const q = submission.status === "success" ? submission.value.q : undefined;
  const [tab, setTab] = useState(defaultTab);
  return (
    <ThreeColumnLayout hideSearch>
      <h1 className="border-b border-line p-4 text-title">検索</h1>
      <SearchFormContainer key={q} q={q} />
      <Tabs
        tabs={(
          [
            ["posts", "投稿"],
            ["accounts", "ユーザー"],
          ] as const
        ).map(([value, label]) => ({
          label,
          selected: tab === value,
          onClick: () => setTab(value),
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

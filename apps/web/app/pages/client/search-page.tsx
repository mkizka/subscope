import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import { SearchFormContainer } from "@/app/features/search/blocks/search-form-container";
import { SearchResultsContainer } from "@/app/features/search/blocks/search-results-container";

type Props = {
  q?: string;
  tab: "accounts" | "posts";
};

export function SearchPage({ q, tab }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-line p-4 text-title">検索</h1>
      <SearchFormContainer q={q} tab={tab} />
      <Tabs
        tabs={(
          [
            ["accounts", "ユーザー", {}],
            ["posts", "投稿", { tab: "posts" }],
          ] as const
        ).map(([value, label, params]) => ({
          to: `?${new URLSearchParams({ ...(q && { q }), ...params })}`,
          label,
          selected: tab === value,
        }))}
      />
      {q && <SearchResultsContainer q={q} tab={tab} />}
    </ThreeColumnLayout>
  );
}

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";
import { SearchFormContainer } from "@/app/features/search/blocks/search-form-container";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

type Props = {
  q?: string;
  tab: "actors" | "posts";
  actors: Actor[];
  posts: TimelinePost[];
};

const NotFound = ({ children }: { children: string }) => (
  <p className="py-8 text-center text-label text-muted">{children}</p>
);

export function SearchPage({ q, tab, actors, posts }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-line p-4 text-title">検索</h1>
      <SearchFormContainer q={q} tab={tab} />
      <Tabs
        tabs={(
          [
            ["actors", "ユーザー", {}],
            ["posts", "投稿", { tab: "posts" }],
          ] as const
        ).map(([value, label, params]) => ({
          to: `?${new URLSearchParams({ ...(q && { q }), ...params })}`,
          label,
          selected: tab === value,
        }))}
      />
      {q &&
        (tab === "actors" ? (
          actors.length > 0 ? (
            <ActorList actors={actors} />
          ) : (
            <NotFound>ユーザーが見つかりません</NotFound>
          )
        ) : posts.length > 0 ? (
          // ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ
          <TimelineFeed posts={posts} />
        ) : (
          <NotFound>投稿が見つかりません</NotFound>
        ))}
    </ThreeColumnLayout>
  );
}

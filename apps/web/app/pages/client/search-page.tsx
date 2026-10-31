import { Link } from "react-router";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
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
  <p className="p-4 text-center text-base-content/60">{children}</p>
);

export function SearchPage({ q, tab, actors, posts }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-base-300 p-4 text-lg font-bold">検索</h1>
      <SearchFormContainer q={q} tab={tab} />
      <div role="tablist" className="tabs tabs-border">
        {(
          [
            ["actors", "ユーザー", {}],
            ["posts", "投稿", { tab: "posts" }],
          ] as const
        ).map(([value, label, params]) => (
          <Link
            key={value}
            to={`?${new URLSearchParams({ ...(q && { q }), ...params })}`}
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "tab tab-active" : "tab"}
          >
            {label}
          </Link>
        ))}
      </div>
      {q &&
        (tab === "actors" ? (
          actors.length > 0 ? (
            <ActorList actors={actors} />
          ) : (
            <NotFound>ユーザーが見つかりません</NotFound>
          )
        ) : posts.length > 0 ? (
          // ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ
          <TimelineFeed posts={posts} onCompose={() => {}} />
        ) : (
          <NotFound>投稿が見つかりません</NotFound>
        ))}
    </ThreeColumnLayout>
  );
}

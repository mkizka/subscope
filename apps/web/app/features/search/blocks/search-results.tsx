import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

type Props = {
  tab: "actors" | "posts";
  actors: Actor[];
  posts: TimelinePost[];
};

const NotFound = ({ children }: { children: string }) => (
  <p className="py-8 text-center text-label text-muted">{children}</p>
);

export function SearchResults({ tab, actors, posts }: Props) {
  if (tab === "actors") {
    return actors.length > 0 ? (
      <ActorList actors={actors} />
    ) : (
      <NotFound>ユーザーが見つかりません</NotFound>
    );
  }
  return posts.length > 0 ? (
    // ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ
    <TimelineFeed posts={posts} />
  ) : (
    <NotFound>投稿が見つかりません</NotFound>
  );
}

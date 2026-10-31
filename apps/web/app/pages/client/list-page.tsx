import { Link } from "react-router";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

type Props = {
  name: string;
  description?: string;
  tab: "posts" | "members";
  posts: TimelinePost[];
  members: Actor[];
};

export function ListPage({ name, description, tab, posts, members }: Props) {
  return (
    <ThreeColumnLayout>
      <section className="flex flex-col gap-2 border-b border-base-300 p-4">
        <h1 className="text-lg font-bold">{name}</h1>
        {description && (
          <p className="text-sm wrap-break-word whitespace-pre-wrap">
            {description}
          </p>
        )}
      </section>
      <div role="tablist" className="tabs tabs-border">
        {(
          [
            ["posts", "投稿", "."],
            ["members", "メンバー", "?tab=members"],
          ] as const
        ).map(([value, label, to]) => (
          <Link
            key={value}
            to={to}
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "tab tab-active" : "tab"}
          >
            {label}
          </Link>
        ))}
      </div>
      {tab === "posts" ? (
        <TimelineFeed posts={posts} onCompose={() => {}} />
      ) : (
        <ActorList actors={members} />
      )}
    </ThreeColumnLayout>
  );
}

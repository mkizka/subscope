import type { ComponentProps } from "react";
import { Link } from "react-router";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { FollowButtonContainer } from "@/app/features/profile/blocks/follow-button-container";
import { ProfileHeader } from "@/app/features/profile/blocks/profile-header";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

const tabLabels = {
  posts: "投稿",
  replies: "リプライ",
  media: "メディア",
  likes: "いいね",
};

type ProfileTab = keyof typeof tabLabels;

type Props = Omit<ComponentProps<typeof ProfileHeader>, "action"> & {
  follow?: ComponentProps<typeof FollowButtonContainer>;
  tabs: ProfileTab[];
  tab: ProfileTab;
  posts: TimelinePost[];
};

export function ProfilePage({ follow, tabs, tab, posts, ...profile }: Props) {
  return (
    <ThreeColumnLayout>
      <ProfileHeader
        {...profile}
        action={follow && <FollowButtonContainer {...follow} />}
      />
      <div role="tablist" className="flex border-b border-line">
        {tabs.map((value) => (
          <Link
            key={value}
            to={value === "posts" ? "." : `?tab=${value}`}
            role="tab"
            aria-selected={tab === value}
            className="
              flex-1 py-2.5 text-center text-sm text-muted
              aria-selected:font-bold aria-selected:text-ink
              aria-selected:shadow-[inset_0_-3px_0_var(--color-brand)]
            "
          >
            {tabLabels[value]}
          </Link>
        ))}
        <Link
          to="lists"
          role="tab"
          className="flex-1 py-2.5 text-center text-sm text-muted"
        >
          リスト
        </Link>
      </div>
      {/* ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ */}
      <TimelineFeed posts={posts} />
    </ThreeColumnLayout>
  );
}

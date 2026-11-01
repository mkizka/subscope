import type { ComponentProps } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
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
      <Tabs
        tabs={[
          ...tabs.map((value) => ({
            to: value === "posts" ? "." : `?tab=${value}`,
            label: tabLabels[value],
            selected: tab === value,
          })),
          { to: "lists", label: "リスト", selected: false },
        ]}
      />
      {/* ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ */}
      <TimelineFeed posts={posts} />
    </ThreeColumnLayout>
  );
}

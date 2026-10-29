import type { ComponentProps } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ProfileHeader } from "@/app/features/profile/blocks/profile-header";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

type Props = ComponentProps<typeof ProfileHeader> & {
  posts: TimelinePost[];
};

export function ProfilePage({ posts, ...profile }: Props) {
  return (
    <ThreeColumnLayout>
      <ProfileHeader {...profile} />
      {/* ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ */}
      <TimelineFeed posts={posts} onCompose={() => {}} />
    </ThreeColumnLayout>
  );
}

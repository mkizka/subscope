import type { ComponentProps } from "react";
import { Link } from "react-router";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { FollowButtonContainer } from "@/app/features/profile/blocks/follow-button-container";
import { ProfileHeader } from "@/app/features/profile/blocks/profile-header";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

type Props = Omit<ComponentProps<typeof ProfileHeader>, "action"> & {
  follow?: ComponentProps<typeof FollowButtonContainer>;
  posts: TimelinePost[];
};

export function ProfilePage({ follow, posts, ...profile }: Props) {
  return (
    <ThreeColumnLayout>
      <ProfileHeader
        {...profile}
        action={follow && <FollowButtonContainer {...follow} />}
      />
      <div role="tablist" className="tabs tabs-border">
        <span role="tab" aria-selected className="tab tab-active">
          投稿
        </span>
        <Link to="lists" role="tab" className="tab">
          リスト
        </Link>
      </div>
      {/* ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ */}
      <TimelineFeed posts={posts} onCompose={() => {}} />
    </ThreeColumnLayout>
  );
}

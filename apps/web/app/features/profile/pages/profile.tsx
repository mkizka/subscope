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
      <TimelineFeed
        posts={posts}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />
    </ThreeColumnLayout>
  );
}

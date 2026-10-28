import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";
import { WelcomeSectionContainer } from "@/app/features/timeline/blocks/welcome-section-container";

type Props = {
  atprotoProxy: string;
  posts: TimelinePost[];
  cursor?: string;
};

export function TimelinePage({ atprotoProxy, posts, cursor }: Props) {
  return (
    <ThreeColumnLayout>
      <WelcomeSectionContainer atprotoProxy={atprotoProxy} />
      <TimelineFeedContainer posts={posts} cursor={cursor} />
    </ThreeColumnLayout>
  );
}

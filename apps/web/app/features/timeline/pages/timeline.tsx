import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";
import { WelcomeSectionContainer } from "@/app/features/timeline/blocks/welcome-section-container";

type Props = {
  atprotoProxy: string;
  posts: TimelinePost[];
};

export function TimelinePage({ atprotoProxy, posts }: Props) {
  return (
    <ThreeColumnLayout>
      <WelcomeSectionContainer atprotoProxy={atprotoProxy} />
      <TimelineFeed posts={posts} />
    </ThreeColumnLayout>
  );
}

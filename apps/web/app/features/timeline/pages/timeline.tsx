import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { PostFormContainer } from "@/app/features/timeline/blocks/post-form-container";
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
      <div className="sticky bottom-0 border-t border-base-300 bg-base-100 p-3">
        <PostFormContainer />
      </div>
    </ThreeColumnLayout>
  );
}

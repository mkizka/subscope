import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { PostFormContainer } from "@/app/features/timeline/blocks/post-form-container";
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
      <div className="sticky bottom-0 border-t border-base-300 bg-base-100 p-3">
        <PostFormContainer />
      </div>
    </ThreeColumnLayout>
  );
}

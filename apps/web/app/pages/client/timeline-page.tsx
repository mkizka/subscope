import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";

type Props = {
  posts: TimelinePost[];
  cursor?: string;
};

export function TimelinePage({ posts, cursor }: Props) {
  return (
    <ThreeColumnLayout>
      <h1
        className="
        sticky top-0 z-10 border-b border-line bg-surface p-4 text-heading
      "
      >
        フォロー中
      </h1>
      <TimelineFeedContainer posts={posts} cursor={cursor} />
    </ThreeColumnLayout>
  );
}

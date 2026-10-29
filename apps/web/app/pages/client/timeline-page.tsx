import { useState } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type ComposeTarget,
  PostFormContainer,
} from "@/app/features/timeline/blocks/post-form-container";
import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";

type Props = {
  posts: TimelinePost[];
  cursor?: string;
};

export function TimelinePage({ posts, cursor }: Props) {
  const [target, setTarget] = useState<ComposeTarget>();
  return (
    <ThreeColumnLayout>
      <TimelineFeedContainer
        posts={posts}
        cursor={cursor}
        onCompose={setTarget}
      />
      <div className="sticky bottom-0 border-t border-base-300 bg-base-100 p-3">
        <PostFormContainer
          target={target}
          onClearTarget={() => setTarget(undefined)}
        />
      </div>
    </ThreeColumnLayout>
  );
}

import { useState } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type ComposeTarget,
  PostFormContainer,
} from "@/app/features/timeline/blocks/post-form-container";
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
  const [target, setTarget] = useState<ComposeTarget>();
  return (
    <ThreeColumnLayout>
      <WelcomeSectionContainer atprotoProxy={atprotoProxy} />
      <TimelineFeed posts={posts} onCompose={setTarget} />
      <div className="sticky bottom-0 border-t border-base-300 bg-base-100 p-3">
        <PostFormContainer
          target={target}
          onClearTarget={() => setTarget(undefined)}
        />
      </div>
    </ThreeColumnLayout>
  );
}

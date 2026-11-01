import { useFetcher } from "react-router";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import type { loader } from "@/app/routes/_index";

import type { ComposeTarget } from "./post-form-container";
import { TimelineFeed, type TimelinePost } from "./timeline-feed";

type OnCompose = (target: ComposeTarget) => void;

function OlderTimelineFeedContainer({
  cursor,
  onCompose,
}: {
  cursor: string;
  onCompose: OnCompose;
}) {
  const fetcher = useFetcher<typeof loader>();
  const data = fetcher.data;

  if (!data) {
    return (
      <InfiniteScrollTrigger
        onIntersect={() =>
          void fetcher.load(`/?${new URLSearchParams({ index: "", cursor })}`)
        }
        enabled={fetcher.state === "idle"}
      />
    );
  }
  return (
    <>
      <TimelineFeed posts={data.posts} onCompose={onCompose} />
      {data.cursor && (
        <OlderTimelineFeedContainer
          cursor={data.cursor}
          onCompose={onCompose}
        />
      )}
    </>
  );
}

type Props = {
  posts: TimelinePost[];
  cursor?: string;
  onCompose: OnCompose;
};

export function TimelineFeedContainer({ posts, cursor, onCompose }: Props) {
  return (
    <>
      <TimelineFeed posts={posts} onCompose={onCompose} />
      {cursor && (
        <OlderTimelineFeedContainer cursor={cursor} onCompose={onCompose} />
      )}
    </>
  );
}

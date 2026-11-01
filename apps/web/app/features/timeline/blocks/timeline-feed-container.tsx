import { useFetcher } from "react-router";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import type { loader } from "@/app/routes/_index";

import { TimelineFeed, type TimelinePost } from "./timeline-feed";

function OlderTimelineFeedContainer({ cursor }: { cursor: string }) {
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
      <TimelineFeed posts={data.posts} />
      {data.cursor && <OlderTimelineFeedContainer cursor={data.cursor} />}
    </>
  );
}

type Props = {
  posts: TimelinePost[];
  cursor?: string;
};

export function TimelineFeedContainer({ posts, cursor }: Props) {
  return (
    <>
      <TimelineFeed posts={posts} />
      {cursor && <OlderTimelineFeedContainer cursor={cursor} />}
    </>
  );
}

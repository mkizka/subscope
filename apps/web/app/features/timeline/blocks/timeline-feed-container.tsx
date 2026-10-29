import { useEffect, useLayoutEffect, useRef } from "react";
import { useFetcher } from "react-router";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import type { loader } from "@/app/routes/_index";

import { TimelineFeed, type TimelinePost } from "./timeline-feed";

function OlderTimelineFeedContainer({ cursor }: { cursor: string }) {
  const fetcher = useFetcher<typeof loader>();
  const data = fetcher.data?.state === "timeline" ? fetcher.data : undefined;
  const distanceFromBottomRef = useRef(0);

  useLayoutEffect(() => {
    if (!data) return;
    window.scrollTo(
      0,
      document.body.scrollHeight - distanceFromBottomRef.current,
    );
  }, [data]);

  if (!data) {
    return (
      <InfiniteScrollTrigger
        onIntersect={() => {
          distanceFromBottomRef.current =
            document.body.scrollHeight - window.scrollY;
          void fetcher.load(`/?${new URLSearchParams({ index: "", cursor })}`);
        }}
        enabled={fetcher.state === "idle"}
      />
    );
  }
  return (
    <>
      {data.cursor && <OlderTimelineFeedContainer cursor={data.cursor} />}
      <TimelineFeed posts={data.posts} />
    </>
  );
}

type Props = {
  posts: TimelinePost[];
  cursor?: string;
};

export function TimelineFeedContainer({ posts, cursor }: Props) {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <>
      {cursor && <OlderTimelineFeedContainer cursor={cursor} />}
      <TimelineFeed posts={posts} />
    </>
  );
}

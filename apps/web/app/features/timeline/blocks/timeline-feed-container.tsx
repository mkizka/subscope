import { useEffect, useLayoutEffect, useRef } from "react";
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
      {data.cursor && (
        <OlderTimelineFeedContainer
          cursor={data.cursor}
          onCompose={onCompose}
        />
      )}
      <TimelineFeed posts={data.posts} onCompose={onCompose} />
    </>
  );
}

type Props = {
  posts: TimelinePost[];
  cursor?: string;
  onCompose: OnCompose;
};

export function TimelineFeedContainer({ posts, cursor, onCompose }: Props) {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <>
      {cursor && (
        <OlderTimelineFeedContainer cursor={cursor} onCompose={onCompose} />
      )}
      <TimelineFeed posts={posts} onCompose={onCompose} />
    </>
  );
}

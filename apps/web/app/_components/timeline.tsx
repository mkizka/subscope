"use client";
import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import AtpAgent from "@atproto/api";
import { useEffect, useRef, useState } from "react";

import { env } from "@/app/_shared/env";

export function Timeline() {
  const agent = useRef(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    new AtpAgent({
      service: "https://bsky.social",
    }),
  );
  const [feedViews, setFeedViews] = useState<AppBskyFeedDefs.FeedViewPost[]>(
    [],
  );

  useEffect(() => {
    void (async () => {
      await agent.current.login({
        identifier: env.NEXT_PUBLIC_BSKY_HANDLE,
        password: env.NEXT_PUBLIC_BSKY_PASSWORD,
      });
      const posts = await agent.current
        .getTimeline()
        .then((timeline) => timeline.data.feed);
      setFeedViews(posts);
    })();
  }, []);

  return feedViews
    .filter((feedView) => !feedView.reply)
    .map((feedView) => {
      const post = feedView.post.record as AppBskyFeedPost.Record;
      // @ts-expect-error
      // eslint-disable-next-line
      const key = feedView.post.cid + (feedView.reason?.by.did ?? "");
      return (
        <div key={key}>
          <p>{post.text}</p>
          <div className="divider" />
        </div>
      );
    });
}

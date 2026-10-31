import { useFetcher } from "react-router";
import { z } from "zodV4";

import { PostToolbar } from "@/app/features/timeline/parts/post-toolbar";
import type { action } from "@/app/routes/api.reactions";

import type { ComposeTarget } from "./post-form-container";
import type { TimelinePost } from "./timeline-feed";

export const reactionSchema = z.object({
  type: z.enum(["like", "repost"]),
  uri: z.string(),
  cid: z.string(),
  recordUri: z.string().optional(),
});

type Props = TimelinePost & {
  onCompose: (target: ComposeTarget) => void;
};

function useReaction(
  type: z.infer<typeof reactionSchema>["type"],
  post: Props,
  viewerUri?: string,
  count = 0,
) {
  const fetcher = useFetcher<typeof action>();
  const recordUri = fetcher.data ? fetcher.data.uri : viewerUri;
  const active = fetcher.formData
    ? !fetcher.formData.get("recordUri")
    : !!recordUri;
  const busy = fetcher.state !== "idle";
  const toggle = () => {
    if (busy) return;
    void fetcher.submit(
      { type, uri: post.uri, cid: post.cid, recordUri: recordUri ?? "" },
      { method: "post", action: "/api/reactions" },
    );
  };
  return {
    active,
    busy,
    toggle,
    count: count - Number(!!viewerUri) + Number(active),
  };
}

export function PostToolbarContainer(props: Props) {
  const like = useReaction("like", props, props.viewerLike, props.likeCount);
  const repost = useReaction(
    "repost",
    props,
    props.viewerRepost,
    props.repostCount,
  );
  return (
    <PostToolbar
      replyCount={props.replyCount}
      repostCount={repost.count}
      likeCount={like.count}
      liked={like.active}
      reposted={repost.active}
      likeBusy={like.busy}
      repostBusy={repost.busy}
      onLike={like.toggle}
      onRepost={repost.toggle}
      onReply={() =>
        props.onCompose({
          type: "reply",
          uri: props.uri,
          cid: props.cid,
          handle: props.authorHandle,
          root: props.replyRoot,
        })
      }
      onQuote={() =>
        props.onCompose({
          type: "quote",
          uri: props.uri,
          cid: props.cid,
          handle: props.authorHandle,
        })
      }
    />
  );
}

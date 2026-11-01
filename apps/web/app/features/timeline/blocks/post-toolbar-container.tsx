import { useState } from "react";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import { PostToolbar } from "@/app/features/timeline/parts/post-toolbar";
import type { action as deletePostAction } from "@/app/routes/api.posts";
import type { action } from "@/app/routes/api.reactions";

import { useCompose } from "./post-form-container";
import type { TimelinePost } from "./timeline-feed";

export const reactionSchema = z.object({
  type: z.enum(["like", "repost"]),
  uri: z.string(),
  cid: z.string(),
  recordUri: z.string().optional(),
});

export const deletePostSchema = z.object({ uri: z.string() });

type Props = TimelinePost;

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
  const openCompose = useCompose();
  const deleter = useFetcher<typeof deletePostAction>();
  const [minReplyCount, setMinReplyCount] = useState(0);
  const replyCount = Math.max(props.replyCount ?? 0, minReplyCount);
  return (
    <PostToolbar
      replyCount={replyCount}
      repostCount={repost.count}
      likeCount={like.count}
      liked={like.active}
      reposted={repost.active}
      likeBusy={like.busy}
      repostBusy={repost.busy}
      onLike={like.toggle}
      onRepost={repost.toggle}
      deleteBusy={deleter.state !== "idle"}
      onDelete={
        props.deletable
          ? () =>
              void deleter.submit(
                { uri: props.uri },
                { method: "post", action: "/api/posts" },
              )
          : undefined
      }
      onReply={() =>
        openCompose({
          type: "reply",
          uri: props.uri,
          cid: props.cid,
          handle: props.authorHandle,
          root: props.replyRoot,
          onPosted: () => setMinReplyCount(replyCount + 1),
        })
      }
      onQuote={() =>
        openCompose({
          type: "quote",
          uri: props.uri,
          cid: props.cid,
          handle: props.authorHandle,
        })
      }
    />
  );
}

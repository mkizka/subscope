import { useState } from "react";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import { useMe } from "@/app/features/navigation/side-nav-container";
import type { TimelinePost } from "@/app/features/timeline/timeline-feed";
import type { action as pinPostAction } from "@/app/routes/api.pinned-post";
import type { action as deletePostAction } from "@/app/routes/api.posts";
import type { action } from "@/app/routes/api.reactions";

import { useCompose } from "./post-form-container";
import { PostToolbar } from "./post-toolbar";

export const reactionSchema = z.object({
  type: z.enum(["like", "repost"]),
  uri: z.string(),
  cid: z.string(),
  recordUri: z.string().optional(),
});

export const deletePostSchema = z.object({
  uri: z.string(),
  redirectTo: z.literal("/").optional(),
});

export const pinPostSchema = z.object({
  uri: z.string(),
  cid: z.string(),
  pinned: z.enum(["true", "false"]),
});

type Props = TimelinePost & { deleteRedirectTo?: "/" };

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
  const me = useMe();
  const deleter = useFetcher<typeof deletePostAction>();
  const pinner = useFetcher<typeof pinPostAction>();
  const pinned = pinner.formData
    ? pinner.formData.get("pinned") === "true"
    : (pinner.data?.pinned ?? !!props.viewerPinned);
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
        me && props.uri.startsWith(`at://${me.did}/`)
          ? () =>
              void deleter.submit(
                { uri: props.uri, redirectTo: props.deleteRedirectTo ?? "" },
                { method: "post", action: "/api/posts" },
              )
          : undefined
      }
      pinned={pinned}
      pinBusy={pinner.state !== "idle"}
      onPin={
        me && props.uri.startsWith(`at://${me.did}/`)
          ? () =>
              void pinner.submit(
                { uri: props.uri, cid: props.cid, pinned: String(!pinned) },
                { method: "post", action: "/api/pinned-post" },
              )
          : undefined
      }
      onCopyLink={() =>
        void navigator.clipboard.writeText(
          `${location.origin}/${props.authorHandle}/post/${props.uri.split("/").pop()}`,
        )
      }
      onReply={() =>
        openCompose({
          type: "reply",
          uri: props.uri,
          cid: props.cid,
          post: props,
          root: props.replyRoot,
          onPosted: () => setMinReplyCount(replyCount + 1),
        })
      }
      onQuote={() =>
        openCompose({
          type: "quote",
          uri: props.uri,
          cid: props.cid,
          post: props,
        })
      }
    />
  );
}

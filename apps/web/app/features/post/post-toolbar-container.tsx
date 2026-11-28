import { AtUri } from "@atproto/syntax";
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { z } from "zodV4";

import { useMe } from "@/app/features/navigation/side-nav-container";
import type { TimelinePost } from "@/app/features/timeline/timeline-feed";
import { fetchJson } from "@/app/lib/fetch-json";
import type { action as pinPostAction } from "@/app/routes/api.pinned-post";
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
});

const deletePostKey = ["deletePost"];

export function useDeletedPostUris() {
  return new Set(
    useMutationState({
      filters: {
        mutationKey: deletePostKey,
        predicate: (mutation) => mutation.state.status !== "error",
      },
      select: (mutation) => String(mutation.state.variables),
    }),
  );
}

export const pinPostSchema = z.object({
  uri: z.string(),
  cid: z.string(),
  pinned: z.enum(["true", "false"]),
});

type Props = TimelinePost & { deleteRedirectTo?: "/" };

function useReaction(
  type: z.infer<typeof reactionSchema>["type"],
  {
    post,
    viewerUri,
    count = 0,
  }: { post: Props; viewerUri?: string; count?: number },
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
  const like = useReaction("like", {
    post: props,
    viewerUri: props.viewerLike,
    count: props.likeCount,
  });
  const repost = useReaction("repost", {
    post: props,
    viewerUri: props.viewerRepost,
    count: props.repostCount,
  });
  const openCompose = useCompose();
  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const deleter = useMutation({
    mutationKey: deletePostKey,
    mutationFn: (uri: string) =>
      fetchJson("/api/posts", {
        method: "POST",
        body: new URLSearchParams({ uri }),
      }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
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
      deleteBusy={deleter.isPending}
      onDelete={
        me && new AtUri(props.uri).host === me.did
          ? () => {
              deleter.mutate(props.uri);
              if (props.deleteRedirectTo) void navigate(props.deleteRedirectTo);
            }
          : undefined
      }
      pinned={pinned}
      pinBusy={pinner.state !== "idle"}
      onPin={
        me && new AtUri(props.uri).host === me.did
          ? () =>
              void pinner.submit(
                { uri: props.uri, cid: props.cid, pinned: String(!pinned) },
                { method: "post", action: "/api/pinned-post" },
              )
          : undefined
      }
      onCopyLink={() =>
        void navigator.clipboard.writeText(
          `${location.origin}/${props.authorHandle}/post/${new AtUri(props.uri).rkey}`,
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

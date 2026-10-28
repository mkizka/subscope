import { useFetcher } from "react-router";

import { PostToolbar } from "@/app/features/timeline/parts/post-toolbar";
import type { action } from "@/app/routes/api.reactions";

import type { ComposeTarget } from "./post-form-container";
import type { TimelinePost } from "./timeline-feed";

type Props = TimelinePost & {
  onCompose: (target: ComposeTarget) => void;
};

function useReaction(type: string, post: Props, viewerUri?: string) {
  const fetcher = useFetcher<typeof action>();
  const recordUri = fetcher.data ? fetcher.data.uri : viewerUri;
  const active = fetcher.formData
    ? !fetcher.formData.get("recordUri")
    : !!recordUri;
  const toggle = () => {
    if (fetcher.state !== "idle") return;
    void fetcher.submit(
      { type, uri: post.uri, cid: post.cid, recordUri: recordUri ?? "" },
      { method: "post", action: "/api/reactions" },
    );
  };
  return { active, toggle };
}

export function PostToolbarContainer(props: Props) {
  const like = useReaction("like", props, props.viewerLike);
  const repost = useReaction("repost", props, props.viewerRepost);
  return (
    <PostToolbar
      liked={like.active}
      reposted={repost.active}
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

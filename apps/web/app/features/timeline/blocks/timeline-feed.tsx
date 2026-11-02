import {
  PostCard,
  type PostCardProps,
} from "@/app/features/timeline/parts/post-card";

import { PostToolbarContainer } from "./post-toolbar-container";

export type TimelinePost = Omit<PostCardProps, "toolbar"> & {
  uri: string;
  cid: string;
  viewerLike?: string;
  viewerRepost?: string;
  replyRoot?: { uri: string; cid: string };
  replyParentUri?: string;
};

type Props = {
  posts: TimelinePost[];
};

export const threadPath = (post: TimelinePost) =>
  `/profile/${post.authorHandle}/post/${post.uri.split("/").pop()}`;

function groupSelfThreads(posts: TimelinePost[]) {
  const groups: TimelinePost[][] = [];
  for (const post of posts) {
    const last = groups.at(-1);
    if (last && last.at(-1)?.replyParentUri === post.uri) {
      last.push(post);
    } else {
      groups.push([post]);
    }
  }
  return groups.map((group) => [...group].reverse());
}

export function TimelineFeed({ posts }: Props) {
  return (
    <section>
      {posts.length === 0 && (
        <p className="py-8 text-center text-label text-muted">
          タイムラインに投稿がありません
        </p>
      )}
      {groupSelfThreads(posts).map((group) =>
        group.map((post, i) => (
          <PostCard
            key={`${post.uri}-${post.reasonRepost?.byHandle ?? ""}`}
            {...post}
            connectedAbove={i > 0}
            connectedBelow={i < group.length - 1}
            threadPath={threadPath(post)}
            toolbar={<PostToolbarContainer {...post} />}
          />
        )),
      )}
    </section>
  );
}

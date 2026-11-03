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
  `/${post.authorHandle}/post/${post.uri.split("/").pop()}`;

function groupThreads(posts: TimelinePost[]) {
  const byUri = new Map<string, number>();
  posts.forEach((post, i) => {
    if (!byUri.has(post.uri)) byUri.set(post.uri, i);
  });
  const childOf = new Map<number, number>();
  const isChild = new Set<number>();
  posts.forEach((post, i) => {
    const parent = byUri.get(post.replyParentUri ?? "");
    if (parent === undefined || parent === i || childOf.has(parent)) return;
    childOf.set(parent, i);
    isChild.add(i);
  });
  const groups: { index: number; posts: TimelinePost[] }[] = [];
  posts.forEach((post, i) => {
    if (isChild.has(i)) return;
    const chain = [i];
    for (let c = childOf.get(i); c !== undefined; c = childOf.get(c)) {
      chain.push(c);
    }
    groups.push({
      index: Math.min(...chain),
      posts: chain.flatMap((j) => posts[j] ?? []),
    });
  });
  return groups.sort((a, b) => a.index - b.index).map((g) => g.posts);
}

export function TimelineFeed({ posts }: Props) {
  return (
    <section>
      {posts.length === 0 && (
        <p className="py-8 text-center text-label text-muted">
          タイムラインに投稿がありません
        </p>
      )}
      {groupThreads(posts).map((group) =>
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

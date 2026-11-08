import { Fragment } from "react";

import { LoadingSpinner } from "@/app/components/loading-spinner";
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
  refreshing?: boolean;
};

export const threadPath = (post: TimelinePost) =>
  `/${post.authorHandle}/post/${post.uri.split("/").pop()}`;

const postKey = (post: TimelinePost) =>
  `${post.uri}-${post.reasonRepost?.byHandle ?? ""}`;

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
  const groups: { index: number; key: string; posts: TimelinePost[] }[] = [];
  posts.forEach((post, i) => {
    if (isChild.has(i)) return;
    const chain = [i];
    for (let c = childOf.get(i); c !== undefined; c = childOf.get(c)) {
      chain.push(c);
    }
    groups.push({
      index: Math.min(...chain),
      key: postKey(post),
      posts: chain.flatMap((j) => posts[j] ?? []),
    });
  });
  return groups.sort((a, b) => a.index - b.index);
}

function OmittedPosts({ count }: { count: number }) {
  return (
    <div
      data-testid="omitted-posts"
      className="flex items-center gap-3 px-4 py-2 text-caption text-muted"
    >
      <span className="ml-[19px] h-6 w-0 border-l-2 border-dotted border-line" />
      {count}件の投稿を省略
    </div>
  );
}

export function TimelineFeed({ posts, refreshing = false }: Props) {
  return (
    <section>
      {refreshing && (
        <div className="relative h-0">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
            <LoadingSpinner label="タイムラインを更新中" />
          </div>
        </div>
      )}
      {posts.length === 0 && (
        <p className="py-8 text-center text-label text-muted">
          タイムラインに投稿がありません
        </p>
      )}
      {groupThreads(posts).map(({ key, posts: group }) => {
        const omitted = Math.max(group.length - 3, 0);
        return (
          <Fragment key={key}>
            {group.map((post, i) => {
              if (omitted > 0 && i > 0 && i < group.length - 2) return null;
              return (
                <Fragment key={postKey(post)}>
                  {omitted > 0 && i === group.length - 2 && (
                    <OmittedPosts count={omitted} />
                  )}
                  <PostCard
                    {...post}
                    connectedAbove={i > 0}
                    connectedBelow={i < group.length - 1}
                    threadPath={threadPath(post)}
                    toolbar={<PostToolbarContainer {...post} />}
                  />
                </Fragment>
              );
            })}
          </Fragment>
        );
      })}
    </section>
  );
}

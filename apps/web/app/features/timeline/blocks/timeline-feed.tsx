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
};

type Props = {
  posts: TimelinePost[];
};

export const threadPath = (post: TimelinePost) =>
  `/profile/${post.authorHandle}/post/${post.uri.split("/").pop()}`;

export function TimelineFeed({ posts }: Props) {
  return (
    <section>
      {posts.length === 0 && (
        <p className="py-8 text-center text-label text-muted">
          タイムラインに投稿がありません
        </p>
      )}
      {posts.map((post) => (
        <PostCard
          key={`${post.uri}-${post.reasonRepost?.byHandle ?? ""}`}
          {...post}
          threadPath={threadPath(post)}
          toolbar={<PostToolbarContainer {...post} />}
        />
      ))}
    </section>
  );
}

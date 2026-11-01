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
  deletable?: boolean;
};

type Props = {
  posts: TimelinePost[];
};

export function TimelineFeed({ posts }: Props) {
  return (
    <section>
      {posts.length === 0 && (
        <p className="py-8 text-center text-sm text-base-content/70">
          タイムラインに投稿がありません
        </p>
      )}
      {posts.map((post) => (
        <PostCard
          key={`${post.uri}-${post.reasonRepost?.byHandle ?? ""}`}
          {...post}
          threadPath={`/profile/${post.authorHandle}/post/${post.uri.split("/").pop()}`}
          toolbar={<PostToolbarContainer {...post} />}
        />
      ))}
    </section>
  );
}

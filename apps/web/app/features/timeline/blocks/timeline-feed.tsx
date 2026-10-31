import {
  PostCard,
  type PostCardProps,
} from "@/app/features/timeline/parts/post-card";

import type { ComposeTarget } from "./post-form-container";
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
  onCompose: (target: ComposeTarget) => void;
};

export function TimelineFeed({ posts, onCompose }: Props) {
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
          threadSearch={new URLSearchParams({ thread: post.uri }).toString()}
          toolbar={<PostToolbarContainer {...post} onCompose={onCompose} />}
        />
      ))}
    </section>
  );
}

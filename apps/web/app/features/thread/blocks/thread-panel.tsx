import { XIcon } from "lucide-react";
import { Link } from "react-router";

import {
  PostCard,
  type PostCardProps,
} from "@/app/features/timeline/parts/post-card";

type Props = {
  posts: (PostCardProps & { uri: string })[];
  closeSearch: string;
};

export function ThreadPanel({ posts, closeSearch }: Props) {
  return (
    <section aria-label="スレッド" className="flex flex-col">
      <Link
        to={{ search: closeSearch }}
        aria-label="閉じる"
        className="btn m-2 btn-square self-end btn-ghost"
      >
        <XIcon />
      </Link>
      {posts.map((post) => (
        <PostCard key={post.uri} {...post} />
      ))}
    </section>
  );
}

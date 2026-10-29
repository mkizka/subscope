import {
  PostCard,
  type PostCardProps,
} from "@/app/features/timeline/parts/post-card";

export type TimelinePost = PostCardProps & {
  uri: string;
};

type Props = {
  posts: TimelinePost[];
};

export function TimelineFeed({ posts }: Props) {
  return (
    <section>
      {posts.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          タイムラインに投稿がありません
        </p>
      )}
      {posts.map((post) => (
        <PostCard key={post.uri} {...post} />
      ))}
    </section>
  );
}

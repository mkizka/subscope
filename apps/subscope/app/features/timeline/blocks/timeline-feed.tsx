import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import {
  PostCard,
  type PostCardProps,
} from "@/app/features/timeline/parts/post-card";
import { PostCardSkeleton } from "@/app/features/timeline/parts/post-card-skeleton";

export type TimelinePost = PostCardProps & {
  uri: string;
};

type Props = {
  posts: TimelinePost[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
};

export function TimelineFeed({
  posts,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: Props) {
  return (
    <section>
      {isLoading &&
        Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)}
      {!isLoading && posts.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          タイムラインに投稿がありません
        </p>
      )}
      {posts.map((post) => (
        <PostCard key={post.uri} {...post} />
      ))}
      {isFetchingNextPage && <PostCardSkeleton />}
      <InfiniteScrollTrigger
        onIntersect={onLoadMore}
        enabled={hasNextPage && !isFetchingNextPage}
      />
    </section>
  );
}

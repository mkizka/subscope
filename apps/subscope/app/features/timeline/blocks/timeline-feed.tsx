import { InfiniteScrollTrigger } from "@/app/features/admin/parts/infinite-scroll-trigger";
import { PostCard } from "@/app/features/timeline/parts/post-card";
import { PostCardSkeleton } from "@/app/features/timeline/parts/post-card-skeleton";

export type TimelinePost = {
  uri: string;
  authorAvatar?: string;
  authorDisplayName?: string;
  authorHandle: string;
  text: string;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  indexedAt: string;
  reasonRepost?: {
    byDisplayName?: string;
    byHandle: string;
  };
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
    <div>
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
    </div>
  );
}

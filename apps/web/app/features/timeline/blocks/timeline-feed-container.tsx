import { useInfiniteQuery } from "@tanstack/react-query";

import type { loader } from "@/app/routes/api.timeline";

import { TimelineFeed, type TimelinePost } from "./timeline-feed";

type TimelineResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchTimeline(cursor?: string): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(`/api/timeline?${params.toString()}`);
  if (!response.ok) {
    throw new Error("タイムラインの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<TimelineResponse>;
}

const maybeString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
};

function toTimelinePost({
  post,
  reason,
}: TimelineResponse["feed"][number]): TimelinePost {
  let reasonRepost;
  if (reason && "by" in reason) {
    reasonRepost = {
      byDisplayName: reason.by.displayName,
      byHandle: reason.by.handle,
    };
  }

  return {
    uri: post.uri,
    authorAvatar: post.author.avatar,
    authorDisplayName: post.author.displayName,
    authorHandle: post.author.handle,
    text: maybeString(post.record.text),
    replyCount: post.replyCount,
    repostCount: post.repostCount,
    likeCount: post.likeCount,
    createdAt: maybeString(post.record.createdAt),
    reasonRepost,
  };
}

export function TimelineFeedContainer() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["timeline"],
      queryFn: ({ pageParam }) => fetchTimeline(pageParam),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      select: (data) => data.pages.flatMap((page) => page.feed),
    });

  const posts = (data ?? []).map(toTimelinePost);

  return (
    <TimelineFeed
      posts={posts}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}

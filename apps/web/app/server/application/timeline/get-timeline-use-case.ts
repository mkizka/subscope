import type {
  ITimelineQuery,
  TimelinePostDto,
} from "@/app/server/infrastructure/timeline/timeline-query";

export interface IGetTimelineUseCase {
  execute: (
    did: string,
    cursor?: string,
  ) => Promise<{
    posts: (TimelinePostDto & { deletable: boolean })[];
    cursor?: string;
  } | null>;
}

export const getTimelineUseCaseFactory = ({
  timelineQuery,
}: {
  timelineQuery: ITimelineQuery;
}): IGetTimelineUseCase => ({
  async execute(did, cursor) {
    if (!(await timelineQuery.isSubscribed(did))) return null;
    const timeline = await timelineQuery.findPosts(did, cursor);
    return {
      posts: timeline.posts
        .filter((post) => post.reasonRepost || !post.replyRoot)
        .map((post) => ({
          ...post,
          deletable: post.uri.startsWith(`at://${did}/`),
        }))
        .reverse(),
      cursor: timeline.cursor,
    };
  },
});

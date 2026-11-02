import type {
  ITimelineQuery,
  TimelinePostDto,
} from "@/app/server/infrastructure/timeline/timeline-query";

export interface IGetTimelineUseCase {
  execute: (
    did: string,
    cursor?: string,
  ) => Promise<{
    posts: TimelinePostDto[];
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
    return timelineQuery.findPosts(did, cursor);
  },
});

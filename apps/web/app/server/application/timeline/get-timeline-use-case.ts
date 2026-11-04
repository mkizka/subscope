import type { TimelinePostDto } from "@/app/server/application/dto/timeline-post-dto";
import type { ITimelineQuery } from "@/app/server/application/interfaces/timeline-query";

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
    if (!(await timelineQuery.isRegistered(did))) return null;
    return timelineQuery.findPosts(did, cursor);
  },
});

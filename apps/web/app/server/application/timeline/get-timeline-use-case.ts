import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import type { ITimelineRepository } from "@/app/server/infrastructure/timeline/timeline-repository";

export interface IGetTimelineUseCase {
  execute: (
    did: string,
    cursor?: string,
  ) => Promise<{ posts: TimelinePost[]; cursor?: string } | null>;
}

export const getTimelineUseCaseFactory = ({
  timelineRepository,
}: {
  timelineRepository: ITimelineRepository;
}): IGetTimelineUseCase => ({
  async execute(did, cursor) {
    if (!(await timelineRepository.isSubscribed(did))) return null;
    const timeline = await timelineRepository.findPosts(did, cursor);
    return {
      posts: timeline.posts
        .filter((post) => post.reasonRepost || !post.replyRoot)
        .reverse(),
      cursor: timeline.cursor,
    };
  },
});

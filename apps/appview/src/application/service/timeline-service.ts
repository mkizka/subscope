import type { ITimelineRepository } from "../interfaces/timeline-repository.js";
import { createCursorPaginator, type Page } from "../utils/pagination.js";

export class TimelineService {
  constructor(private readonly timelineRepository: ITimelineRepository) {}
  static inject = ["timelineRepository"] as const;

  async findPostsWithPagination({
    authDid,
    cursor,
    limit,
  }: {
    authDid: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<{ uri: string; sortAt: Date }>> {
    const paginator = createCursorPaginator(
      limit,
      (post: { uri: string; sortAt: Date }) => post.sortAt.toISOString(),
    );

    const posts = await this.timelineRepository.findPosts({
      authDid,
      cursor,
      limit: paginator.queryLimit,
    });

    return paginator.extractPage(posts);
  }
}

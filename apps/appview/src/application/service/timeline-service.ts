import type {
  ITimelineRepository,
  TimelinePost,
} from "../interfaces/timeline-repository.js";
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
  }): Promise<Page<TimelinePost>> {
    const paginator = createCursorPaginator<TimelinePost>({
      limit,
      getCursor: (post) => post.sortAt.toISOString(),
    });

    const posts = await this.timelineRepository.findPosts({
      authDid,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(posts);
  }
}

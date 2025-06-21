import { PaginationResult } from "../../domain/models/pagination-result.js";
import type { TimelineQuery } from "../../domain/models/timeline-query.js";
import type { ITimelineRepository } from "../interfaces/timeline-repository.js";

export class TimelineService {
  constructor(private readonly timelineRepository: ITimelineRepository) {}
  static inject = ["timelineRepository"] as const;

  async findPostsWithPagination(
    query: TimelineQuery,
  ): Promise<PaginationResult<{ uri: string; sortAt: Date }>> {
    const posts = await this.timelineRepository.findPosts({
      authDid: query.authDid,
      before: query.before,
      limit: query.queryLimit,
    });
    return PaginationResult.create(posts, query.limit, (post) => post.sortAt);
  }
}

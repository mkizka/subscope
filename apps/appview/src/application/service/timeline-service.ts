import type { PaginationQuery } from "../../domain/models/pagination-query.js";
import { PaginationResult } from "../../domain/models/pagination-result.js";
import type { ITimelineRepository } from "../interfaces/timeline-repository.js";

export class TimelineService {
  constructor(private readonly timelineRepository: ITimelineRepository) {}
  static inject = ["timelineRepository"] as const;

  async findPostsWithPagination(
    query: PaginationQuery<{ authDid: string }>,
  ): Promise<PaginationResult<{ uri: string; sortAt: Date }>> {
    const posts = await this.timelineRepository.findPosts({
      authDid: query.params.authDid,
      cursor: query.cursor,
      limit: query.queryLimit,
    });
    return PaginationResult.create(posts, query.limit, (post) => post.sortAt);
  }
}

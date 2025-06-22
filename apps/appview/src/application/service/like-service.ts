import type { Like } from "@repo/common/domain";

import type { PaginationQuery } from "../../domain/models/pagination-query.js";
import { PaginationResult } from "../../domain/models/pagination-result.js";
import type { ILikeRepository } from "../interfaces/like-repository.js";

export class LikeService {
  constructor(private readonly likeRepository: ILikeRepository) {}
  static inject = ["likeRepository"] as const;

  async findLikesWithPagination(
    query: PaginationQuery<{ subjectUri: string }>,
  ): Promise<PaginationResult<Like>> {
    const likes = await this.likeRepository.findMany({
      subjectUri: query.params.subjectUri,
      limit: query.queryLimit,
      cursor: query.cursor,
    });

    return PaginationResult.create(likes, query.limit, (like) => like.sortAt);
  }
}

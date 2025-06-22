import type { Like } from "@repo/common/domain";

import type { LikeQuery } from "../../domain/models/like-query.js";
import { PaginationResult } from "../../domain/models/pagination-result.js";
import type { ILikeRepository } from "../interfaces/like-repository.js";

export class LikeService {
  constructor(private readonly likeRepository: ILikeRepository) {}
  static inject = ["likeRepository"] as const;

  async findLikesWithPagination(
    query: LikeQuery,
  ): Promise<PaginationResult<Like>> {
    const likes = await this.likeRepository.findMany({
      subjectUri: query.subjectUri,
      limit: query.queryLimit,
      cursor: query.before?.toISOString(),
    });

    return PaginationResult.create(likes, query.limit, (like) => like.sortAt);
  }
}

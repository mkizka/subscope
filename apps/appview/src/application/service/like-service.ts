import type { Like } from "@repo/common/domain";

import type { ILikeRepository } from "../interfaces/like-repository.js";
import { createCursorPaginator, type Page } from "../utils/pagination.js";

export class LikeService {
  constructor(private readonly likeRepository: ILikeRepository) {}
  static inject = ["likeRepository"] as const;

  async findLikesWithPagination({
    subjectUri,
    cursor,
    limit,
  }: {
    subjectUri: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<Like>> {
    const paginator = createCursorPaginator<Like>({
      limit,
      getCursor: (like) => like.sortAt.toISOString(),
    });

    const likes = await this.likeRepository.findMany({
      subjectUri,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(likes);
  }
}

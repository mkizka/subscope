import type { Like } from "@repo/common/domain";

import type { ILikeQuery } from "../../../application/interfaces/like-query.js";
import {
  createCursorPaginator,
  type Page,
} from "../../../application/utils/pagination.js";

export class LikeService {
  constructor(private readonly likeQuery: ILikeQuery) {}

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

    const likes = await this.likeQuery.findSubjectLikes({
      subjectUri,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(likes);
  }
}

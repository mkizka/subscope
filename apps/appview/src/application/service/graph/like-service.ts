import type { SubjectLikeDto } from "../../../application/dto/like-dto.js";
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
  }): Promise<Page<SubjectLikeDto>> {
    const paginator = createCursorPaginator<SubjectLikeDto>({
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

import type { RepostDto } from "../../dto/repost-dto.js";
import type { IRepostQuery } from "../../interfaces/repost-query.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";

export class RepostService {
  constructor(private readonly repostQuery: IRepostQuery) {}

  async findRepostsWithPagination({
    subjectUri,
    cursor,
    limit,
  }: {
    subjectUri: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<RepostDto>> {
    const paginator = createCursorPaginator<RepostDto>({
      limit,
      getCursor: (repost) => repost.sortAt.toISOString(),
    });

    const reposts = await this.repostQuery.findBySubject({
      subjectUri,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(reposts);
  }
}

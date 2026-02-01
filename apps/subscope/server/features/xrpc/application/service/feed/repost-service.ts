import type { Repost } from "@repo/common/domain";

import type { IRepostRepository } from "@/server/features/xrpc/application/interfaces/repost-repository.js";
import {
  createCursorPaginator,
  type Page,
} from "@/server/features/xrpc/application/utils/pagination.js";

export class RepostService {
  constructor(private readonly repostRepository: IRepostRepository) {}
  static inject = ["repostRepository"] as const;

  async findRepostsWithPagination({
    subjectUri,
    cursor,
    limit,
  }: {
    subjectUri: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<Repost>> {
    const paginator = createCursorPaginator<Repost>({
      limit,
      getCursor: (repost) => repost.sortAt.toISOString(),
    });

    const reposts = await this.repostRepository.findRepostsByPost({
      subjectUri,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(reposts);
  }
}

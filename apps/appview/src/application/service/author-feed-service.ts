import type { FeedItem } from "@repo/common/domain";

import type { IAuthorFeedRepository } from "../interfaces/author-feed-repository.js";
import { createCursorPaginator, type Page } from "../utils/pagination.js";

export class AuthorFeedService {
  constructor(private readonly authorFeedRepository: IAuthorFeedRepository) {}
  static inject = ["authorFeedRepository"] as const;

  async findFeedItemsWithPagination({
    actorDid,
    cursor,
    limit,
  }: {
    actorDid: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<FeedItem>> {
    const paginator = createCursorPaginator<FeedItem>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.authorFeedRepository.findFeedItems({
      actorDid,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(feedItems);
  }
}

import type { FeedItem } from "@repo/common/domain";

import type { IAuthorFeedRepository } from "@/server/features/xrpc/application/interfaces/author-feed-repository.js";
import {
  createCursorPaginator,
  type Page,
} from "@/server/features/xrpc/application/utils/pagination.js";

export class AuthorFeedService {
  constructor(private readonly authorFeedRepository: IAuthorFeedRepository) {}
  static inject = ["authorFeedRepository"] as const;

  async findFeedItemsWithPagination({
    actorDid,
    cursor,
    limit,
    filter,
  }: {
    actorDid: string;
    cursor?: Date;
    limit: number;
    filter?: string;
  }): Promise<Page<FeedItem>> {
    const paginator = createCursorPaginator<FeedItem>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.fetchFeedItems({
      actorDid,
      limit: paginator.queryLimit,
      cursor,
      filter,
    });

    return paginator.extractPage(feedItems);
  }

  private async fetchFeedItems({
    actorDid,
    cursor,
    limit,
    filter,
  }: {
    actorDid: string;
    cursor?: Date;
    limit: number;
    filter?: string;
  }): Promise<FeedItem[]> {
    if (filter === "posts_no_replies") {
      return this.authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid,
        limit,
        cursor,
      });
    }

    return this.authorFeedRepository.findFeedItems({
      actorDid,
      limit,
      cursor,
    });
  }
}

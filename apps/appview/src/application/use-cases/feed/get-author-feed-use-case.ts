import { type Did } from "@atproto/did";
import type * as AppBskyFeedGetAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type { IAuthorFeedQuery } from "../../../application/interfaces/author-feed-query.js";
import type { FeedProcessor } from "../../../application/service/feed/feed-processor.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

type Filter = AppBskyFeedGetAuthorFeed.$Params["filter"];

type GetAuthorFeedParams = {
  actorDid: Did;
  limit: number;
  filter: Filter;
  includePins: boolean;
  cursor?: Date;
  viewerDid?: Did;
};

export class UnsupportedFilterError extends Error {
  constructor(filter: string) {
    super(`filter ${filter} is not supported`);
    this.name = "UnsupportedFilterError";
  }
}

export class GetAuthorFeedUseCase {
  private supportedFilters: Filter[] = [
    "posts_with_replies",
    "posts_no_replies",
    "posts_with_media",
    "posts_and_author_threads",
  ];

  constructor(
    private readonly authorFeedQuery: IAuthorFeedQuery,
    private readonly feedProcessor: FeedProcessor,
  ) {}

  async execute(
    params: GetAuthorFeedParams,
  ): Promise<AppBskyFeedGetAuthorFeed.$OutputBody> {
    if (!this.supportedFilters.includes(params.filter)) {
      throw new UnsupportedFilterError(params.filter);
    }

    const paginator = createCursorPaginator<FeedItemDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.findFeedItems(params.filter, {
      actorDid: params.actorDid,
      limit: paginator.queryLimit,
      cursor: params.cursor,
    });
    const page = paginator.extractPage(feedItems);

    const feed = await this.feedProcessor.processFeedItems(
      page.items,
      params.viewerDid,
    );

    return {
      feed,
      cursor: page.cursor,
    };
  }

  private findFeedItems(
    filter: Filter,
    params: { actorDid: Did; limit: number; cursor?: Date },
  ): Promise<FeedItemDto[]> {
    switch (filter) {
      case "posts_no_replies":
        return this.authorFeedQuery.findFeedItemsWithoutReplies(params);
      case "posts_with_media":
        return this.authorFeedQuery.findFeedItemsWithMedia(params);
      case "posts_and_author_threads":
        return this.authorFeedQuery.findFeedItemsWithAuthorThreads(params);
      default:
        return this.authorFeedQuery.findFeedItems(params);
    }
  }
}

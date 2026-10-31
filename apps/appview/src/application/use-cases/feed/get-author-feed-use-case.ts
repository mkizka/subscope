import { type Did } from "@atproto/did";
import type * as AppBskyFeedGetAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";

import type { AuthorFeedService } from "../../../application/service/feed/author-feed-service.js";
import type { FeedProcessor } from "../../../application/service/feed/feed-processor.js";

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
    private readonly authorFeedService: AuthorFeedService,
    private readonly feedProcessor: FeedProcessor,
  ) {}

  async execute(
    params: GetAuthorFeedParams,
  ): Promise<AppBskyFeedGetAuthorFeed.$OutputBody> {
    if (!this.supportedFilters.includes(params.filter)) {
      throw new UnsupportedFilterError(params.filter);
    }

    const page = await this.authorFeedService.findFeedItemsWithPagination({
      actorDid: params.actorDid,
      cursor: params.cursor,
      limit: params.limit,
      filter: params.filter,
    });

    const feed = await this.feedProcessor.processFeedItems(
      page.items,
      params.viewerDid,
    );

    return {
      feed,
      cursor: page.cursor,
    };
  }
}

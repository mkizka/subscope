import { type Did } from "@atproto/did";
import type { AppBskyFeedGetAuthorFeed } from "@repo/client/server";

import type { AuthorFeedService } from "@/server/features/xrpc/application/service/feed/author-feed-service.js";
import type { FeedProcessor } from "@/server/features/xrpc/application/service/feed/feed-processor.js";

type Filter = AppBskyFeedGetAuthorFeed.QueryParams["filter"];

type GetAuthorFeedParams = {
  actorDid: Did;
  limit: number;
  filter: Filter;
  includePins: boolean;
  cursor?: Date;
  viewerDid?: Did;
};

export class GetAuthorFeedUseCase {
  // TODO: 残りのフィルターもサポート
  private supportedFilters: Filter[] = [
    "posts_with_replies",
    "posts_no_replies",
    // "posts_with_media",
    // "posts_and_author_threads",
    // "posts_with_video",
  ];

  constructor(
    private readonly authorFeedService: AuthorFeedService,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["authorFeedService", "feedProcessor"] as const;

  async execute(
    params: GetAuthorFeedParams,
  ): Promise<AppBskyFeedGetAuthorFeed.OutputSchema> {
    if (!this.supportedFilters.includes(params.filter)) {
      return {
        feed: [],
        cursor: undefined,
      };
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

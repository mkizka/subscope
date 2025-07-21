import { type Did } from "@atproto/did";
import type { AppBskyFeedGetAuthorFeed } from "@repo/client/server";

import type { AuthorFeedService } from "../../service/feed/author-feed-service.js";
import type { FeedProcessor } from "../../service/feed/feed-processor.js";

export class GetAuthorFeedUseCase {
  constructor(
    private readonly authorFeedService: AuthorFeedService,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["authorFeedService", "feedProcessor"] as const;

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: Date;
    filter: AppBskyFeedGetAuthorFeed.QueryParams["filter"];
    includePins: boolean;
  }): Promise<AppBskyFeedGetAuthorFeed.OutputSchema> {
    // TODO: posts_and_author_threads以外もサポート
    if (params.filter !== "posts_and_author_threads") {
      return {
        feed: [],
        cursor: undefined,
      };
    }

    const page = await this.authorFeedService.findFeedItemsWithPagination({
      actorDid: params.actorDid,
      cursor: params.cursor,
      limit: params.limit,
    });

    const feed = await this.feedProcessor.processFeedItems(page.items);

    return {
      feed,
      cursor: page.cursor,
    };
  }
}

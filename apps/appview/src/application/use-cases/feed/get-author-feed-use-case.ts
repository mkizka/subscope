import { type Did } from "@atproto/did";
import type * as AppBskyFeedGetAuthorFeed from "@repo/client/app/bsky/feed/getAuthorFeed";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IAuthorFeedQuery } from "../../interfaces/queries/author-feed-query.js";
import type { FeedViews } from "../../views/feed-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type Filter = AppBskyFeedGetAuthorFeed.$Params["filter"];

type GetAuthorFeedParams = {
  accountDid: Did;
  limit: number;
  filter: Filter;
  includePins: boolean;
  cursor?: Date;
  viewerDid?: Did;
};

export class GetAuthorFeedUseCase {
  constructor(
    private readonly authorFeedQuery: IAuthorFeedQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly feedViews: FeedViews,
  ) {}

  async execute(
    params: GetAuthorFeedParams,
  ): Promise<AppBskyFeedGetAuthorFeed.$OutputBody> {
    const paginator = createCursorPaginator<FeedItemDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.findFeedItems(params.filter, {
      accountDid: params.accountDid,
      limit: paginator.queryLimit,
      cursor: params.cursor,
    });
    const page = paginator.extractPage(feedItems);

    const ctx = this.viewContextFactory.create({ viewerDid: params.viewerDid });
    const feed = await Promise.all(
      page.items.map((item) => this.feedViews.feedViewPost(item, ctx)),
    );

    return {
      feed: feed.filter((item) => item !== undefined),
      cursor: page.cursor,
    };
  }

  private findFeedItems(
    filter: Filter,
    params: { accountDid: Did; limit: number; cursor?: Date },
  ): Promise<FeedItemDto[]> {
    switch (filter) {
      case "posts_no_replies":
        return this.authorFeedQuery.findFeedItemsWithoutReplies(params);
      case "posts_with_media":
        return this.authorFeedQuery.findFeedItemsWithMedia(params);
      case "posts_with_video":
        return this.authorFeedQuery.findFeedItemsWithVideo(params);
      case "posts_and_author_threads":
        return this.authorFeedQuery.findFeedItemsWithAuthorThreads(params);
      default:
        return this.authorFeedQuery.findFeedItems(params);
    }
  }
}

import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetListFeed from "@repo/client/lex/app/bsky/feed/getListFeed";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type { ITimelineQuery } from "../../../application/interfaces/timeline-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { FeedViews } from "../../views/feed-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetListFeedUseCase {
  constructor(
    private readonly timelineQuery: ITimelineQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly feedViews: FeedViews,
  ) {}

  async execute(params: {
    listUri: string;
    limit: number;
    cursor?: string;
    viewerDid?: Did;
  }): Promise<AppBskyFeedGetListFeed.$OutputBody> {
    const paginator = createCursorPaginator<FeedItemDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.timelineQuery.findListFeedItems({
      listUri: params.listUri,
      limit: paginator.queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
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
}

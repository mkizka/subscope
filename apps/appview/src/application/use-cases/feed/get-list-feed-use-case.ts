import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetListFeed from "@repo/client/lex/app/bsky/feed/getListFeed";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type { ITimelineQuery } from "../../../application/interfaces/timeline-query.js";
import type { FeedProcessor } from "../../../application/service/feed/feed-processor.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

export class GetListFeedUseCase {
  constructor(
    private readonly timelineQuery: ITimelineQuery,
    private readonly feedProcessor: FeedProcessor,
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

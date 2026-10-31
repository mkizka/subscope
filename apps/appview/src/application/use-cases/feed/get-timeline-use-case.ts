import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type { ITimelineQuery } from "../../../application/interfaces/timeline-query.js";
import type { FeedProcessor } from "../../../application/service/feed/feed-processor.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

type GetTimelineParams = {
  limit: number;
  viewerDid: Did;
  algorithm?: string;
  cursor?: string;
};

export class GetTimelineUseCase {
  constructor(
    private readonly timelineQuery: ITimelineQuery,
    private readonly feedProcessor: FeedProcessor,
  ) {}

  async execute({
    limit,
    viewerDid,
    algorithm: _, // TODO: アルゴリズムごとに実装を追加
    cursor,
  }: GetTimelineParams): Promise<AppBskyFeedGetTimeline.$OutputBody> {
    const paginator = createCursorPaginator<FeedItemDto>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.timelineQuery.findFeedItems({
      viewerDid,
      limit: paginator.queryLimit,
      cursor: cursor ? new Date(cursor) : undefined,
    });
    const page = paginator.extractPage(feedItems);

    const feed = await this.feedProcessor.processFeedItems(
      page.items,
      viewerDid,
    );

    return {
      feed,
      cursor: page.cursor,
    };
  }
}

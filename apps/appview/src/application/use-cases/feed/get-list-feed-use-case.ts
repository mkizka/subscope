import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetListFeed from "@repo/client/lex/app/bsky/feed/getListFeed";
import type { FeedItem } from "@repo/common/domain";

import type { ITimelineRepository } from "../../../application/interfaces/timeline-repository.js";
import type { FeedProcessor } from "../../../application/service/feed/feed-processor.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

export class GetListFeedUseCase {
  constructor(
    private readonly timelineRepository: ITimelineRepository,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["timelineRepository", "feedProcessor"] as const;

  async execute(params: {
    listUri: string;
    limit: number;
    cursor?: string;
    viewerDid?: Did;
  }): Promise<AppBskyFeedGetListFeed.$OutputBody> {
    const paginator = createCursorPaginator<FeedItem>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.timelineRepository.findListFeedItems({
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

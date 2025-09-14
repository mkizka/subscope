import type { Did } from "@atproto/did";
import type { AppBskyFeedGetTimeline } from "@repo/client/server";

import type { FeedProcessor } from "../../service/feed/feed-processor.js";
import type { TimelineService } from "../../service/feed/timeline-service.js";

export class GetTimelineUseCase {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["timelineService", "feedProcessor"] as const;

  async execute(
    params: AppBskyFeedGetTimeline.QueryParams,
    authDid: Did,
  ): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const page = await this.timelineService.findFeedItemsWithPagination({
      authDid,
      cursor,
      limit: params.limit,
    });

    const feed = await this.feedProcessor.processFeedItems(page.items, authDid);

    return {
      feed,
      cursor: page.cursor,
    };
  }
}

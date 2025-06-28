import type { AppBskyFeedGetTimeline } from "@repo/client/server";

import type { FeedProcessor } from "./service/feed-processor.js";
import type { TimelineService } from "./service/timeline-service.js";

export class GetTimelineUseCase {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["timelineService", "feedProcessor"] as const;

  async execute(
    params: AppBskyFeedGetTimeline.QueryParams,
    authDid: string,
  ): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const paginationResult =
      await this.timelineService.findFeedItemsWithPagination({
        authDid,
        cursor,
        limit: params.limit,
      });

    return await this.feedProcessor.processFeedItems(paginationResult);
  }
}

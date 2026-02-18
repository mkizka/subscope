import type { Did } from "@atproto/did";
import type { AppBskyFeedGetTimeline } from "@repo/client/server";

import type { FeedProcessor } from "@/server/features/xrpc/application/service/feed/feed-processor.js";
import type { TimelineService } from "@/server/features/xrpc/application/service/feed/timeline-service.js";

type GetTimelineParams = {
  limit: number;
  viewerDid: Did;
  algorithm?: string;
  cursor?: string;
};

export class GetTimelineUseCase {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["timelineService", "feedProcessor"] as const;

  async execute({
    limit,
    viewerDid,
    algorithm: _, // TODO: アルゴリズムごとに実装を追加
    cursor,
  }: GetTimelineParams): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const page = await this.timelineService.findFeedItemsWithPagination({
      viewerDid,
      limit,
      cursor: cursor ? new Date(cursor) : undefined,
    });

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

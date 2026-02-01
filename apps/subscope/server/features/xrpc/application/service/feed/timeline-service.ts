import type { Did } from "@atproto/did";
import type { FeedItem } from "@repo/common/domain";

import type { ITimelineRepository } from "@/server/features/xrpc/application/interfaces/timeline-repository.js";
import {
  createCursorPaginator,
  type Page,
} from "@/server/features/xrpc/application/utils/pagination.js";

export class TimelineService {
  constructor(private readonly timelineRepository: ITimelineRepository) {}
  static inject = ["timelineRepository"] as const;

  async findFeedItemsWithPagination({
    viewerDid,
    limit,
    cursor,
  }: {
    viewerDid: Did;
    limit: number;
    cursor?: Date;
  }): Promise<Page<FeedItem>> {
    const paginator = createCursorPaginator<FeedItem>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.timelineRepository.findFeedItems({
      viewerDid,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(feedItems);
  }
}

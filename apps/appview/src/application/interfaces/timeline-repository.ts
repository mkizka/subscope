import type { FeedItem } from "@repo/common/domain";

export interface ITimelineRepository {
  findFeedItems: (params: {
    authDid: string;
    limit: number;
    cursor?: Date;
  }) => Promise<FeedItem[]>;
}

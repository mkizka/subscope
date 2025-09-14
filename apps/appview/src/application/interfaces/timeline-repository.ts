import type { Did } from "@atproto/did";
import type { FeedItem } from "@repo/common/domain";

export interface ITimelineRepository {
  findFeedItems: (params: {
    viewerDid: Did;
    limit: number;
    cursor?: Date;
  }) => Promise<FeedItem[]>;
}

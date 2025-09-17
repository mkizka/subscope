import type { FeedItem } from "@repo/common/domain";

export interface IAuthorFeedRepository {
  findFeedItems: (params: {
    actorDid: string;
    limit: number;
    cursor?: Date;
  }) => Promise<FeedItem[]>;

  findFeedItemsWithoutReplies: (params: {
    actorDid: string;
    limit: number;
    cursor?: Date;
  }) => Promise<FeedItem[]>;
}

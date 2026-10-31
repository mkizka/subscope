import type { FeedItem } from "@repo/common/domain";

type FindParams = {
  actorDid: string;
  limit: number;
  cursor?: Date;
};

export interface IAuthorFeedRepository {
  findFeedItems: (params: FindParams) => Promise<FeedItem[]>;
  findFeedItemsWithoutReplies: (params: FindParams) => Promise<FeedItem[]>;
  findFeedItemsWithMedia: (params: FindParams) => Promise<FeedItem[]>;
  findFeedItemsWithAuthorThreads: (params: FindParams) => Promise<FeedItem[]>;
}

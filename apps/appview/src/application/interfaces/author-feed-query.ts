import type { FeedItemDto } from "../dto/feed-item-dto.js";

type FindParams = {
  actorDid: string;
  limit: number;
  cursor?: Date;
};

export interface IAuthorFeedQuery {
  findFeedItems: (params: FindParams) => Promise<FeedItemDto[]>;
  findFeedItemsWithoutReplies: (params: FindParams) => Promise<FeedItemDto[]>;
  findFeedItemsWithMedia: (params: FindParams) => Promise<FeedItemDto[]>;
  findFeedItemsWithAuthorThreads: (
    params: FindParams,
  ) => Promise<FeedItemDto[]>;
}

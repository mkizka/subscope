import type { Did } from "@atproto/did";

import type { FeedItemDto } from "../dto/feed-item-dto.js";

export interface ITimelineQuery {
  findFeedItems: (params: {
    viewerDid: Did;
    limit: number;
    cursor?: Date;
  }) => Promise<FeedItemDto[]>;

  findListFeedItems: (params: {
    listUri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<FeedItemDto[]>;
}

import type { FeedItem } from "@repo/common/domain";

import type { IAuthorFeedRepository } from "../../application/interfaces/author-feed-repository.js";

type FeedItemWithMeta = {
  feedItem: FeedItem;
  isReply: boolean;
};

export class InMemoryAuthorFeedRepository implements IAuthorFeedRepository {
  private feedItems: FeedItemWithMeta[] = [];

  add(feedItem: FeedItem, isReply = false): void {
    this.feedItems.push({ feedItem, isReply });
  }

  clear(): void {
    this.feedItems = [];
  }

  findFeedItems(params: {
    actorDid: string;
    limit: number;
    cursor?: Date;
  }): Promise<FeedItem[]> {
    let items = this.feedItems
      .filter((item) => item.feedItem.actorDid === params.actorDid)
      .map((item) => item.feedItem);

    if (params.cursor) {
      const cursor = params.cursor;
      items = items.filter((item) => item.sortAt < cursor);
    }

    items.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

    return Promise.resolve(items.slice(0, params.limit));
  }

  findFeedItemsWithoutReplies(params: {
    actorDid: string;
    limit: number;
    cursor?: Date;
  }): Promise<FeedItem[]> {
    let items = this.feedItems
      .filter((item) => {
        if (item.feedItem.actorDid !== params.actorDid) {
          return false;
        }
        if (item.feedItem.type === "repost") {
          return true;
        }
        return !item.isReply;
      })
      .map((item) => item.feedItem);

    if (params.cursor) {
      const cursor = params.cursor;
      items = items.filter((item) => item.sortAt < cursor);
    }

    items.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

    return Promise.resolve(items.slice(0, params.limit));
  }
}

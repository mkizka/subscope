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

  addAll(feedItems: Array<{ feedItem: FeedItem; isReply?: boolean }>): void {
    this.feedItems.push(
      ...feedItems.map((item) => ({
        feedItem: item.feedItem,
        isReply: item.isReply ?? false,
      })),
    );
  }

  clear(): void {
    this.feedItems = [];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findFeedItems(params: {
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

    return items.slice(0, params.limit);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findFeedItemsWithoutReplies(params: {
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

    return items.slice(0, params.limit);
  }
}

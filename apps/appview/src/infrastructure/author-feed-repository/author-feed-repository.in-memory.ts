import type { FeedItem } from "@repo/common/domain";

import type { IAuthorFeedRepository } from "../../application/interfaces/author-feed-repository.js";

type FeedItemMeta = {
  isReply?: boolean;
  isAuthorThread?: boolean;
  hasMedia?: boolean;
};

type FindParams = {
  actorDid: string;
  limit: number;
  cursor?: Date;
};

export class InMemoryAuthorFeedRepository implements IAuthorFeedRepository {
  private feedItems: { feedItem: FeedItem; meta: FeedItemMeta }[] = [];

  add(feedItem: FeedItem, meta: FeedItemMeta = {}): void {
    this.feedItems.push({ feedItem, meta });
  }

  clear(): void {
    this.feedItems = [];
  }

  findFeedItems(
    params: FindParams,
    predicate: (feedItem: FeedItem, meta: FeedItemMeta) => boolean = () => true,
  ): Promise<FeedItem[]> {
    const cursor = params.cursor;
    const items = this.feedItems
      .filter(
        ({ feedItem, meta }) =>
          feedItem.actorDid === params.actorDid &&
          (!cursor || feedItem.sortAt < cursor) &&
          predicate(feedItem, meta),
      )
      .map(({ feedItem }) => feedItem)
      .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

    return Promise.resolve(items.slice(0, params.limit));
  }

  findFeedItemsWithoutReplies(params: FindParams): Promise<FeedItem[]> {
    return this.findFeedItems(
      params,
      (feedItem, meta) => feedItem.type === "repost" || !meta.isReply,
    );
  }

  findFeedItemsWithMedia(params: FindParams): Promise<FeedItem[]> {
    return this.findFeedItems(
      params,
      (feedItem, meta) => feedItem.type === "post" && !!meta.hasMedia,
    );
  }

  findFeedItemsWithAuthorThreads(params: FindParams): Promise<FeedItem[]> {
    return this.findFeedItems(
      params,
      (feedItem, meta) =>
        feedItem.type === "repost" || !meta.isReply || !!meta.isAuthorThread,
    );
  }
}

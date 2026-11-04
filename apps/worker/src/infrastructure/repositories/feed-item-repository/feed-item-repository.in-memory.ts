import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IFeedItemRepository } from "../../../application/interfaces/repositories/feed-item-repository.js";
import type { FeedItem } from "../../../application/models/feed-item.js";

export class InMemoryFeedItemRepository implements IFeedItemRepository {
  private feedItems: Map<string, FeedItem> = new Map();

  add(feedItem: FeedItem): void {
    this.feedItems.set(feedItem.uri, feedItem);
  }

  clear(): void {
    this.feedItems.clear();
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<FeedItem | null> {
    return this.feedItems.get(uri.toString()) ?? null;
  }

  async save({
    feedItem,
  }: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }): Promise<void> {
    this.feedItems.set(feedItem.uri, feedItem);
  }
}

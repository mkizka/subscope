import type { AtUri } from "@atproto/syntax";
import type { FeedItem, TransactionContext } from "@repo/common/domain";

import type { IFeedItemRepository } from "../../../application/interfaces/repositories/feed-item-repository.js";

export class InMemoryFeedItemRepository implements IFeedItemRepository {
  private feedItems: Map<string, FeedItem> = new Map();

  add(feedItem: FeedItem): void {
    this.feedItems.set(feedItem.uri.toString(), feedItem);
  }

  clear(): void {
    this.feedItems.clear();
  }

  async findByUri(params: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<FeedItem | null> {
    return this.feedItems.get(params.uri.toString()) ?? null;
  }

  async upsert({
    feedItem,
  }: {
    ctx: TransactionContext;
    feedItem: FeedItem;
  }): Promise<void> {
    this.feedItems.set(feedItem.uri.toString(), feedItem);
  }
}

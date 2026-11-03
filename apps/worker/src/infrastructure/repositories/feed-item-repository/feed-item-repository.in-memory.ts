import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IFeedItemRepository } from "../../../application/interfaces/repositories/feed-item-repository.js";
import type { FeedItemRow } from "../../../application/record-parsers.js";

export class InMemoryFeedItemRepository implements IFeedItemRepository {
  private feedItems: Map<string, FeedItemRow> = new Map();

  add(feedItem: FeedItemRow): void {
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
  }): Promise<FeedItemRow | null> {
    return this.feedItems.get(uri.toString()) ?? null;
  }

  async save({
    feedItem,
  }: {
    ctx: TransactionContext;
    feedItem: FeedItemRow;
  }): Promise<void> {
    this.feedItems.set(feedItem.uri, feedItem);
  }
}

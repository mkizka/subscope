import type { Record, TransactionContext } from "@repo/common/domain";
import { FeedItem, Repost } from "@repo/common/domain";

import type { RepostIndexingPolicy } from "../../../domain/repost-indexing-policy.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class RepostIndexer implements ICollectionIndexer {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly repostIndexingPolicy: RepostIndexingPolicy,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postRepository: IPostRepository,
  ) {}
  static inject = [
    "repostRepository",
    "repostIndexingPolicy",
    "postStatsRepository",
    "feedItemRepository",
    "postRepository",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const repost = Repost.from(record);
    await this.repostRepository.upsert({ ctx, repost });

    const feedItem = FeedItem.fromRepost(repost);
    await this.feedItemRepository.upsertRepost({ ctx, feedItem });
  }

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const repost = Repost.from(record);
    return await this.repostIndexingPolicy.shouldIndex(ctx, repost);
  }

  async updateStats({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<void> {
    const repost = Repost.from(record);

    // 対象の投稿が存在する場合のみstatsを更新
    const postExists = await this.postRepository.exists(
      ctx,
      repost.subjectUri.toString(),
    );
    if (postExists) {
      await this.postStatsRepository.upsertRepostCount({
        ctx,
        uri: repost.subjectUri,
      });
    }
  }
}

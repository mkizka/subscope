import type { Record, TransactionContext } from "@repo/common/domain";
import { FeedItem, Repost } from "@repo/common/domain";

import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type {
  ICollectionIndexer,
  IndexingContext,
} from "../../interfaces/services/index-collection-service.js";
import type { AggregatePostStatsScheduler } from "../scheduler/aggregate-post-stats-scheduler.js";
import type { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";

export class RepostIndexer implements ICollectionIndexer {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly aggregatePostStatsScheduler: AggregatePostStatsScheduler,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postRepository: IPostRepository,
    private readonly fetchRecordScheduler: FetchRecordScheduler,
  ) {}
  static inject = [
    "repostRepository",
    "aggregatePostStatsScheduler",
    "feedItemRepository",
    "postRepository",
    "fetchRecordScheduler",
  ] as const;

  async upsert({
    ctx,
    record,
    indexingCtx,
  }: {
    ctx: TransactionContext;
    record: Record;
    indexingCtx: IndexingContext;
  }) {
    const repost = Repost.from(record);
    await this.repostRepository.upsert({ ctx, repost });

    const feedItem = FeedItem.fromRepost(repost);
    await this.feedItemRepository.upsert({ ctx, feedItem });

    const subjectExists = await this.postRepository.exists(
      ctx,
      repost.subjectUri,
    );
    if (!subjectExists) {
      await this.fetchRecordScheduler.schedule(repost.subjectUri, indexingCtx);
    }
  }

  async afterAction({ record }: { record: Record }): Promise<void> {
    const repost = Repost.from(record);
    await this.aggregatePostStatsScheduler.schedule(
      repost.subjectUri,
      "repost",
    );
  }
}

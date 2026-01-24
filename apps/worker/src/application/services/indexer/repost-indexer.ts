import type {
  IJobScheduler,
  Record,
  TransactionContext,
} from "@repo/common/domain";
import { FeedItem, Repost } from "@repo/common/domain";

import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class RepostIndexer implements ICollectionIndexer {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postRepository: IPostRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}
  static inject = [
    "repostRepository",
    "feedItemRepository",
    "postRepository",
    "jobScheduler",
  ] as const;

  async upsert({
    ctx,
    record,
    live,
    depth,
  }: {
    ctx: TransactionContext;
    record: Record;
    live: boolean;
    depth: number;
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
      await this.jobScheduler.scheduleFetchRecord(repost.subjectUri, {
        live,
        depth,
      });
    }
  }

  async afterAction({ record }: { record: Record }): Promise<void> {
    const repost = Repost.from(record);
    await this.jobScheduler.scheduleAggregatePostStats(
      repost.subjectUri,
      "repost",
    );
  }
}

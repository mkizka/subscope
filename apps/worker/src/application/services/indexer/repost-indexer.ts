import type { Record, TransactionContext } from "@repo/common/domain";
import { Repost } from "@repo/common/domain";

import type { RepostIndexingPolicy } from "../../../domain/repost-indexing-policy.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class RepostIndexer implements ICollectionIndexer {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly repostIndexingPolicy: RepostIndexingPolicy,
    private readonly postStatsRepository: IPostStatsRepository,
  ) {}
  static inject = [
    "repostRepository",
    "repostIndexingPolicy",
    "postStatsRepository",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const repost = Repost.from(record);
    await this.repostRepository.upsert({ ctx, repost });
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
    await this.postStatsRepository.upsertRepostCount({
      ctx,
      uri: repost.subjectUri,
    });
  }
}

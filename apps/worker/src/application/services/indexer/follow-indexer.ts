import type { Record, TransactionContext } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { FollowIndexingPolicy } from "../../../domain/follow-indexing-policy.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "../index-actor-service.js";
import type { AggregateActorStatsScheduler } from "../scheduler/aggregate-actor-stats-scheduler.js";
import type { RefreshSubscriberFolloweesScheduler } from "../scheduler/refresh-subscriber-followees-scheduler.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly followIndexingPolicy: FollowIndexingPolicy,
    private readonly aggregateActorStatsScheduler: AggregateActorStatsScheduler,
    private readonly indexActorService: IndexActorService,
    private readonly refreshSubscriberFolloweesScheduler: RefreshSubscriberFolloweesScheduler,
  ) {}
  static inject = [
    "followRepository",
    "followIndexingPolicy",
    "aggregateActorStatsScheduler",
    "indexActorService",
    "refreshSubscriberFolloweesScheduler",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const follow = Follow.from(record);
    await this.indexActorService.upsert({
      ctx,
      did: follow.subjectDid,
      indexedAt: record.indexedAt,
    });
    await this.followRepository.upsert({ ctx, follow });
  }

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const follow = Follow.from(record);
    return await this.followIndexingPolicy.shouldIndex(ctx, follow);
  }

  async afterAction({
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<void> {
    const follow = Follow.from(record);
    await this.aggregateActorStatsScheduler.schedule(
      follow.actorDid,
      "follows",
    );
    await this.aggregateActorStatsScheduler.schedule(
      follow.subjectDid,
      "followers",
    );
    await this.refreshSubscriberFolloweesScheduler.schedule();
  }
}

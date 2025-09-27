import type { Record, TransactionContext } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { FollowIndexingPolicy } from "../../../domain/follow-indexing-policy.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "../index-actor-service.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly followIndexingPolicy: FollowIndexingPolicy,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly indexActorService: IndexActorService,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = [
    "followRepository",
    "followIndexingPolicy",
    "actorStatsRepository",
    "indexActorService",
    "subscriptionRepository",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const follow = Follow.from(record);
    const isFollowedBySubscriber =
      await this.subscriptionRepository.isSubscriber(ctx, follow.actorDid);
    await this.indexActorService.upsert({
      ctx,
      did: follow.subjectDid,
      indexedAt: record.indexedAt,
      isFollowedBySubscriber,
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
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<void> {
    const follow = Follow.from(record);

    await this.actorStatsRepository.upsertFollowsCount({
      ctx,
      actorDid: follow.actorDid,
    });

    await this.actorStatsRepository.upsertFollowersCount({
      ctx,
      actorDid: follow.subjectDid,
    });
  }
}

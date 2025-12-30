import type {
  IJobQueue,
  Record,
  TransactionContext,
} from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "../index-actor-service.js";
import type { AggregateActorStatsScheduler } from "../scheduler/aggregate-actor-stats-scheduler.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly aggregateActorStatsScheduler: AggregateActorStatsScheduler,
    private readonly indexActorService: IndexActorService,
    private readonly jobQueue: IJobQueue,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = [
    "followRepository",
    "aggregateActorStatsScheduler",
    "indexActorService",
    "jobQueue",
    "subscriptionRepository",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const follow = Follow.from(record);
    await this.indexActorService.upsert({
      ctx,
      did: follow.subjectDid,
    });
    await this.followRepository.upsert({ ctx, follow });

    const isFollowerSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      follow.actorDid,
    );
    if (isFollowerSubscriber) {
      await this.jobQueue.add({
        queueName: "addTapRepo",
        jobName: "addTapRepo",
        data: follow.subjectDid,
      });
    }
  }

  async afterAction({
    ctx,
    record,
    action,
  }: {
    ctx: TransactionContext;
    record: Record;
    action: "upsert" | "delete";
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

    if (action === "delete") {
      const isFollowerSubscriber =
        await this.subscriptionRepository.isSubscriber(ctx, follow.actorDid);
      if (!isFollowerSubscriber) return;

      const isStillFollowed =
        await this.followRepository.isFollowedByAnySubscriber({
          ctx,
          subjectDid: follow.subjectDid,
        });
      if (isStillFollowed) return;

      await this.jobQueue.add({
        queueName: "removeTapRepo",
        jobName: "removeTapRepo",
        data: follow.subjectDid,
      });
    }
  }
}

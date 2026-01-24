import type {
  IJobScheduler,
  Record,
  TransactionContext,
} from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "../index-actor-service.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly indexActorService: IndexActorService,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = [
    "followRepository",
    "jobScheduler",
    "indexActorService",
    "subscriptionRepository",
  ] as const;

  async upsert({
    ctx,
    record,
    live,
  }: {
    ctx: TransactionContext;
    record: Record;
    live: boolean;
  }) {
    const follow = Follow.from(record);
    await this.indexActorService.upsert({
      ctx,
      did: follow.subjectDid,
      live,
    });
    await this.followRepository.upsert({ ctx, follow });

    const isFollowerSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      follow.actorDid,
    );
    if (isFollowerSubscriber) {
      await this.jobScheduler.scheduleAddTapRepo(follow.subjectDid);
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
    await this.jobScheduler.scheduleAggregateActorStats(
      follow.actorDid,
      "follows",
    );
    await this.jobScheduler.scheduleAggregateActorStats(
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

      await this.jobScheduler.scheduleRemoveTapRepo(follow.subjectDid);
    }
  }
}

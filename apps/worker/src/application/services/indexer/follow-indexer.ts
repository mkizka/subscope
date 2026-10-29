import type {
  IJobScheduler,
  Record,
  TransactionContext,
} from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "../index-actor-service.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly indexActorService: IndexActorService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}
  static inject = [
    "followRepository",
    "jobScheduler",
    "indexActorService",
    "subscriptionRepository",
    "notificationRepository",
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
      await this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid);
    }

    if (
      follow.subjectDid !== follow.actorDid &&
      (await this.subscriptionRepository.isSubscriber(ctx, follow.subjectDid))
    ) {
      await this.notificationRepository.createMany({
        ctx,
        notifications: [
          {
            recordUri: follow.uri.toString(),
            recipientDid: follow.subjectDid,
            authorDid: follow.actorDid,
            reason: "follow",
            reasonSubject: null,
            sortAt: follow.sortAt,
          },
        ],
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
    await this.jobScheduler.scheduleAggregateActorStats(
      follow.actorDid,
      "follows",
    );
    await this.jobScheduler.scheduleAggregateActorStats(
      follow.subjectDid,
      "followers",
    );

    if (
      action === "delete" &&
      (await this.subscriptionRepository.isSubscriber(ctx, follow.actorDid))
    ) {
      await this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid);
    }
  }
}

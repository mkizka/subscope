import type {
  AfterCommitContext,
  IJobScheduler,
  Record,
} from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { ISubscriptionQuery } from "../../interfaces/queries/subscription-query.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "../index-actor-service.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly indexActorService: IndexActorService,
    private readonly subscriptionQuery: ISubscriptionQuery,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async upsert({
    ctx,
    record,
    live,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
  }) {
    const follow = Follow.from(record);
    await this.indexActorService.upsert({
      ctx,
      did: follow.subjectDid,
      live,
    });
    await this.followRepository.save({ ctx, follow });

    const isFollowerSubscriber = await this.subscriptionQuery.isSubscriber(
      ctx,
      follow.actorDid,
    );
    if (isFollowerSubscriber) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid),
      );
    }

    if (
      follow.subjectDid !== follow.actorDid &&
      (await this.subscriptionQuery.isSubscriber(ctx, follow.subjectDid))
    ) {
      await this.notificationRepository.save({
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
    ctx: AfterCommitContext;
    record: Record;
    action: "upsert" | "delete";
  }): Promise<void> {
    const follow = Follow.from(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregateActorStats(follow.actorDid, "follows"),
    );
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregateActorStats(
        follow.subjectDid,
        "followers",
      ),
    );

    if (
      action === "delete" &&
      (await this.subscriptionQuery.isSubscriber(ctx, follow.actorDid))
    ) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid),
      );
    }
  }
}

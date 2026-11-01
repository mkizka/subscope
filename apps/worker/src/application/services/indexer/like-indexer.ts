import type {
  AfterCommitContext,
  IJobScheduler,
  Record,
} from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async upsert({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = Like.from(record);
    await this.likeRepository.upsert({ ctx, like });

    const recipientDid = like.subjectUri.host;
    if (
      recipientDid !== like.actorDid &&
      (await this.subscriptionRepository.isSubscriber(ctx, recipientDid))
    ) {
      await this.notificationRepository.createMany({
        ctx,
        notifications: [
          {
            recordUri: like.uri.toString(),
            recipientDid,
            authorDid: like.actorDid,
            reason: "like",
            reasonSubject: like.subjectUri.toString(),
            sortAt: like.sortAt,
          },
        ],
      });
    }
  }

  afterAction({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = Like.from(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregatePostStats(like.subjectUri),
    );
  }
}

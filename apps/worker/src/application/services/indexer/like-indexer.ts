import type {
  AfterCommitContext,
  IJobScheduler,
  Record,
} from "@repo/common/domain";
import { Like } from "@repo/common/domain";

import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: AfterCommitContext;
    record: Record;
  }) {
    const like = Like.from(record);
    return (
      (await this.registrationQuery.isRegistered(ctx, like.actorDid)) ||
      (await this.registrationQuery.isRegistered(ctx, like.subjectUri.host))
    );
  }

  async upsert({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = Like.from(record);
    const recipientDid = like.subjectUri.host;
    const isRecipientRegisteredAccount =
      await this.registrationQuery.isRegistered(ctx, recipientDid);
    await this.likeRepository.save({ ctx, like });

    if (recipientDid !== like.actorDid && isRecipientRegisteredAccount) {
      await this.notificationRepository.save({
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

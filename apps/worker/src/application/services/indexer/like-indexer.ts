import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import { parseLike } from "../../dto/like.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
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
    const like = parseLike(record);
    return (
      (await this.registrationQuery.isRegistered(ctx, like.accountDid)) ||
      (await this.registrationQuery.isRegistered(
        ctx,
        new AtUri(like.subjectUri).host,
      ))
    );
  }

  async upsert({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = parseLike(record);
    const recipientDid = new AtUri(like.subjectUri).host;
    const isRecipientServerMember = await this.registrationQuery.isRegistered(
      ctx,
      recipientDid,
    );
    await this.likeRepository.save({ ctx, like });

    if (recipientDid !== like.accountDid && isRecipientServerMember) {
      await this.notificationRepository.save({
        ctx,
        notifications: [
          {
            recordUri: like.uri,
            recipientDid,
            authorDid: like.accountDid,
            reason: "like",
            reasonSubject: like.subjectUri,
            sortAt: getSortAt(like),
          },
        ],
      });
    }
  }

  afterAction({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = parseLike(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregatePostStats(new AtUri(like.subjectUri)),
    );
  }
}

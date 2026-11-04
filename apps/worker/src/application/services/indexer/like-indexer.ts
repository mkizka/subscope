import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/domain";

import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import { parseLike } from "../../models/like.js";
import type { Record } from "../../models/record.js";
import { getSortAt } from "../../models/sort-at.js";

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
    const isRecipientRegisteredAccount =
      await this.registrationQuery.isRegistered(ctx, recipientDid);
    await this.likeRepository.save({ ctx, like });

    if (recipientDid !== like.accountDid && isRecipientRegisteredAccount) {
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

import type { AfterCommitContext, IJobScheduler } from "@repo/common/domain";

import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import { parseFollow } from "../../models/follow.js";
import type { Record } from "../../models/record.js";
import { getSortAt } from "../../models/sort-at.js";
import type { IndexAccountService } from "../index-account-service.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly indexAccountService: IndexAccountService,
    private readonly registrationQuery: IRegistrationQuery,
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
    const follow = parseFollow(record);
    await this.indexAccountService.upsert({
      ctx,
      did: follow.subjectDid,
      live,
    });
    await this.followRepository.save({ ctx, follow });

    const isFollowerRegisteredAccount =
      await this.registrationQuery.isRegistered(ctx, follow.accountDid);
    if (isFollowerRegisteredAccount) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid),
      );
    }

    if (
      follow.subjectDid !== follow.accountDid &&
      (await this.registrationQuery.isRegistered(ctx, follow.subjectDid))
    ) {
      await this.notificationRepository.save({
        ctx,
        notifications: [
          {
            recordUri: follow.uri,
            recipientDid: follow.subjectDid,
            authorDid: follow.accountDid,
            reason: "follow",
            reasonSubject: null,
            sortAt: getSortAt(follow),
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
    const follow = parseFollow(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregateAccountStats(follow.accountDid),
    );
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregateAccountStats(follow.subjectDid),
    );

    if (
      action === "delete" &&
      (await this.registrationQuery.isRegistered(ctx, follow.accountDid))
    ) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid),
      );
    }
  }
}

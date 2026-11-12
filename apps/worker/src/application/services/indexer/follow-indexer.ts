import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import { parseFollow } from "../../dto/follow.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { NotificationService } from "../notification-service.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly indexAccountService: IndexAccountService,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly notificationService: NotificationService,
  ) {}

  async upsert({
    ctx,
    record,
    live,
    depth,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
    depth: number;
  }) {
    const follow = parseFollow(record);
    await this.indexAccountService.upsert({
      ctx,
      did: follow.subjectDid,
      live,
    });
    await this.followRepository.save({ ctx, follow });

    const isFollowerServerMember = await this.registrationQuery.isRegistered(
      ctx,
      follow.accountDid,
    );
    if (isFollowerServerMember) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid),
      );
    }

    if (
      live &&
      depth === 0 &&
      follow.subjectDid !== follow.accountDid &&
      (await this.registrationQuery.isRegistered(ctx, follow.subjectDid))
    ) {
      await this.notificationService.create({
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

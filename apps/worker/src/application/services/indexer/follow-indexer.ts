import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { parseFollow } from "../../dto/follow.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { NotificationService } from "../notification-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";
import type { StatsService } from "../stats-service.js";

export class FollowIndexer implements IRecordIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly indexAccountService: IndexAccountService,
    private readonly recordSaveService: RecordSaveService,
    private readonly notificationService: NotificationService,
    private readonly relatedRecordService: RelatedRecordService,
    private readonly statsService: StatsService,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async index({
    ctx,
    record,
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) {
    const follow = parseFollow(record);
    const isFollowerMember = await this.registrationQuery.isRegistered(
      ctx,
      follow.accountDid,
    );

    await this.recordSaveService.save({ ctx, record, origin });
    await this.indexAccountService.upsert({ ctx, did: follow.subjectDid });
    await this.followRepository.save({ ctx, follow });

    await this.notificationService.notify({
      ctx,
      origin,
      notifications: () => [
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
    if (isFollowerMember) {
      await this.relatedRecordService.requestAccount({
        ctx,
        origin,
        did: follow.subjectDid,
      });
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid),
      );
    }
    this.statsService.recount({
      ctx,
      accounts: [follow.accountDid, follow.subjectDid],
    });
  }

  async afterDelete({
    ctx,
    record,
  }: {
    ctx: AfterCommitContext;
    record: Record;
  }) {
    const follow = parseFollow(record);
    const isFollowerMember = await this.registrationQuery.isRegistered(
      ctx,
      follow.accountDid,
    );
    if (isFollowerMember) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleSyncTapRepo(follow.subjectDid),
      );
    }
    this.statsService.recount({
      ctx,
      accounts: [follow.accountDid, follow.subjectDid],
    });
  }
}

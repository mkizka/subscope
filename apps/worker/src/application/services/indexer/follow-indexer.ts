import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import { Follow } from "../../../domain/follow.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { NotificationService } from "../notification-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";
import type { StatsService } from "../stats-service.js";

export class FollowIndexer implements IRecordIndexer {
  constructor(
    private readonly deps: {
      followRepository: IFollowRepository;
      storagePolicy: StoragePolicy;
      indexAccountService: IndexAccountService;
      recordSaveService: RecordSaveService;
      notificationService: NotificationService;
      relatedRecordService: RelatedRecordService;
      statsService: StatsService;
      jobScheduler: IJobScheduler;
    },
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
    const follow = Follow.fromRecord(record);
    const saves = await this.deps.storagePolicy.saves({
      ctx,
      origin,
      record: follow,
    });
    if (!saves) {
      return false;
    }
    const tracksFollowee = await this.deps.storagePolicy.tracksFollowee(
      ctx,
      follow,
    );

    await this.deps.recordSaveService.save({ ctx, record });
    await this.deps.relatedRecordService.requestFor({
      ctx,
      origin,
      record: follow,
    });
    await this.deps.indexAccountService.upsert({ ctx, did: follow.subjectDid });
    await this.deps.followRepository.save({ ctx, follow });

    await this.deps.notificationService.notify({
      ctx,
      origin,
      notifications: () => [follow.notification],
    });
    if (tracksFollowee) {
      ctx.afterCommit(() =>
        this.deps.jobScheduler.scheduleSyncAccountKind(follow.subjectDid, {
          fromRegistration: false,
        }),
      );
    }
    this.deps.statsService.recount({
      ctx,
      accounts: [follow.accountDid, follow.subjectDid],
    });
    return true;
  }

  async afterDelete({
    ctx,
    record,
  }: {
    ctx: AfterCommitContext;
    record: Record;
  }) {
    const follow = Follow.fromRecord(record);
    const tracksFollowee = await this.deps.storagePolicy.tracksFollowee(
      ctx,
      follow,
    );
    if (tracksFollowee) {
      ctx.afterCommit(() =>
        this.deps.jobScheduler.scheduleSyncAccountKind(follow.subjectDid, {
          fromRegistration: false,
        }),
      );
    }
    this.deps.statsService.recount({
      ctx,
      accounts: [follow.accountDid, follow.subjectDid],
    });
  }
}

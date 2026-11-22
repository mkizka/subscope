import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext } from "@repo/common/interface";

import type { JobPriority, Origin } from "../dto/origin.js";
import type { Record } from "../dto/record.js";
import type { INotificationRepository } from "../interfaces/repositories/notification-repository.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type { FetchPolicyService } from "./fetch-policy-service.js";
import type { IndexJobService } from "./index-job-service.js";
import type { NotificationPolicyService } from "./notification-policy-service.js";
import type { SaveRecordService } from "./save-record-service.js";
import type { StatsPolicyService } from "./stats-policy-service.js";
import type { StoragePolicyService } from "./storage-policy-service.js";
import type { TrackingPolicyService } from "./tracking-policy-service.js";

export class IndexRecordService {
  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly saveRecordService: SaveRecordService,
    private readonly storagePolicyService: StoragePolicyService,
    private readonly fetchPolicyService: FetchPolicyService,
    private readonly notificationPolicyService: NotificationPolicyService,
    private readonly statsPolicyService: StatsPolicyService,
    private readonly trackingPolicyService: TrackingPolicyService,
    private readonly indexJobService: IndexJobService,
  ) {}

  async index({
    ctx,
    record,
    origin,
    priority,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
    priority: JobPriority;
  }): Promise<void> {
    const shouldStore = await this.storagePolicyService.shouldStore({
      ctx,
      record,
      origin,
    });
    if (!shouldStore) {
      return;
    }
    await this.saveRecordService.save({ ctx, record });

    const notifications = await this.notificationPolicyService.notificationsFor(
      {
        ctx,
        record,
        origin,
      },
    );
    const pushes = await this.notificationRepository.save({
      ctx,
      notifications,
    });

    this.indexJobService.schedule({
      ctx,
      priority,
      fetch: await this.fetchPolicyService.targetsForRecord({
        ctx,
        record,
        origin,
      }),
      stats: this.statsPolicyService.targetsFor(record),
      reposToSync: await this.trackingPolicyService.reposToSync({
        ctx,
        record,
      }),
      pushes,
    });
  }

  async delete({ ctx, uri }: { ctx: AfterCommitContext; uri: AtUri }) {
    const existingRecord = await this.recordRepository.find({ ctx, uri });

    await this.recordRepository.delete({ ctx, uri });

    if (!existingRecord) {
      return;
    }
    this.indexJobService.schedule({
      ctx,
      priority: "high",
      stats: this.statsPolicyService.targetsFor(existingRecord),
      reposToSync: await this.trackingPolicyService.reposToSync({
        ctx,
        record: existingRecord,
      }),
    });
  }
}

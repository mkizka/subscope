import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, JobPriority } from "@repo/common/interface";

import type { Author } from "../dto/author.js";
import type { Origin } from "../dto/origin.js";
import { parseRecord } from "../dto/parsed-record.js";
import type { Record } from "../dto/record.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { INotificationRepository } from "../interfaces/repositories/notification-repository.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";
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
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
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
    const parsed = parseRecord(record);
    const author = await this.authorOf(ctx, record);
    const shouldStore = await this.storagePolicyService.shouldStore({
      ctx,
      record,
      parsed,
      author,
      origin,
    });
    if (!shouldStore) {
      return;
    }
    await this.saveRecordService.save({ ctx, record, parsed });

    const notifications = await this.notificationPolicyService.notificationsFor(
      {
        ctx,
        parsed,
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
        parsed,
        author,
        origin,
      }),
      stats: this.statsPolicyService.targetsFor(parsed),
      reposToSync: this.trackingPolicyService.reposToSync({ parsed, author }),
      pushes,
    });
  }

  async delete({ ctx, uri }: { ctx: AfterCommitContext; uri: AtUri }) {
    const existingRecord = await this.recordRepository.find({ ctx, uri });

    await this.recordRepository.delete({ ctx, uri });

    if (!existingRecord) {
      return;
    }
    const parsed = parseRecord(existingRecord);
    this.indexJobService.schedule({
      ctx,
      priority: "high",
      stats: this.statsPolicyService.targetsFor(parsed),
      reposToSync: this.trackingPolicyService.reposToSync({
        parsed,
        author: await this.authorOf(ctx, existingRecord),
      }),
    });
  }

  private async authorOf(
    ctx: AfterCommitContext,
    record: Record,
  ): Promise<Author> {
    const did = record.uri.did;
    return {
      did,
      isMember: await this.registrationQuery.isRegistered(ctx, did),
      tracking: await this.trackingRepository.find({ ctx, did }),
    };
  }
}

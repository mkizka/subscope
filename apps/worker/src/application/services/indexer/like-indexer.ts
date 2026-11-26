import type { AfterCommitContext } from "@repo/common/interface";

import { Like } from "../../../domain/like.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { NotificationService } from "../notification-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";
import type { StatsService } from "../stats-service.js";

export class LikeIndexer implements IRecordIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly storagePolicy: StoragePolicy,
    private readonly recordSaveService: RecordSaveService,
    private readonly notificationService: NotificationService,
    private readonly relatedRecordService: RelatedRecordService,
    private readonly statsService: StatsService,
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
    const like = Like.fromRecord(record);
    const { stores, fetchesSubject } = await this.storagePolicy.decideLike({
      ctx,
      origin,
      like,
    });
    if (!stores) {
      return;
    }

    await this.recordSaveService.save({ ctx, record, origin });
    await this.likeRepository.save({ ctx, like });

    await this.notificationService.notify({
      ctx,
      origin,
      notifications: () => [like.notification],
    });
    if (fetchesSubject) {
      await this.relatedRecordService.request({
        ctx,
        origin,
        uri: like.subject,
      });
    }
    this.statsService.recount({ ctx, posts: [like.subject] });
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = Like.fromRecord(record);
    this.statsService.recount({ ctx, posts: [like.subject] });
  }
}

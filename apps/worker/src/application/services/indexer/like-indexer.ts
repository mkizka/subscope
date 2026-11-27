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
    private readonly deps: {
      likeRepository: ILikeRepository;
      storagePolicy: StoragePolicy;
      recordSaveService: RecordSaveService;
      notificationService: NotificationService;
      relatedRecordService: RelatedRecordService;
      statsService: StatsService;
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
    const like = Like.fromRecord(record);
    const saves = await this.deps.storagePolicy.saves({
      ctx,
      origin,
      record: like,
    });
    if (!saves) {
      return;
    }

    await this.deps.recordSaveService.save({ ctx, record });
    await this.deps.relatedRecordService.requestFor({
      ctx,
      origin,
      record: like,
    });
    await this.deps.likeRepository.save({ ctx, like });

    await this.deps.notificationService.notify({
      ctx,
      origin,
      notifications: () => [like.notification],
    });
    this.deps.statsService.recount({ ctx, posts: [like.subject] });
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = Like.fromRecord(record);
    this.deps.statsService.recount({ ctx, posts: [like.subject] });
  }
}

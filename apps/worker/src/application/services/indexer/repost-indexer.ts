import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import { Repost } from "../../../domain/repost.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { NotificationService } from "../notification-service.js";
import type { PastRecordFilterService } from "../past-record-filter-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";
import type { StatsService } from "../stats-service.js";

export class RepostIndexer implements IRecordIndexer {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly pastRecordFilterService: PastRecordFilterService,
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
    const repost = Repost.fromRecord(record);
    const accepted = await this.pastRecordFilterService.accepts({
      ctx,
      origin,
      did: repost.accountDid,
      createdAt: repost.createdAt,
    });
    if (!accepted) {
      return;
    }

    await this.recordSaveService.save({ ctx, record, origin });
    await this.repostRepository.save({ ctx, repost });
    await this.feedItemRepository.save({ ctx, feedItem: repost.feedItem });

    await this.notificationService.notify({
      ctx,
      origin,
      notifications: () => [repost.notification],
    });
    await this.relatedRecordService.request({
      ctx,
      origin,
      uri: repost.subject,
    });
    this.statsService.recount({ ctx, posts: [repost.subject] });
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const repost = Repost.fromRecord(record);
    this.statsService.recount({ ctx, posts: [repost.subject] });
  }
}

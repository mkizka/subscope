import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { feedItemFromRepost } from "../../dto/feed-item.js";
import type { Record } from "../../dto/record.js";
import { parseRepost } from "../../dto/repost.js";
import { getSortAt } from "../../dto/sort-at.js";
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
    const repost = parseRepost(record);
    const subjectUri = new AtUri(repost.subjectUri);
    const accepted = await this.pastRecordFilterService.accepts({
      ctx,
      origin,
      did: record.uri.did,
      createdAt: repost.createdAt,
    });
    if (!accepted) {
      return;
    }

    await this.recordSaveService.save({ ctx, record, origin });
    await this.repostRepository.save({ ctx, repost });
    await this.feedItemRepository.save({
      ctx,
      feedItem: feedItemFromRepost(repost),
    });

    await this.notificationService.notify({
      ctx,
      origin,
      notifications: () => [
        {
          recordUri: repost.uri,
          recipientDid: subjectUri.host,
          authorDid: repost.accountDid,
          reason: "repost",
          reasonSubject: repost.subjectUri,
          sortAt: getSortAt(repost),
        },
      ],
    });
    await this.relatedRecordService.request({ ctx, origin, uri: subjectUri });
    this.statsService.recount({ ctx, posts: [subjectUri] });
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const repost = parseRepost(record);
    this.statsService.recount({ ctx, posts: [new AtUri(repost.subjectUri)] });
  }
}

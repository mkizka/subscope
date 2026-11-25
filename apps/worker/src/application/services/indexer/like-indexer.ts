import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { parseLike } from "../../dto/like.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { NotificationService } from "../notification-service.js";
import type { PastRecordFilterService } from "../past-record-filter-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";
import type { StatsService } from "../stats-service.js";

export class LikeIndexer implements IRecordIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly registrationQuery: IRegistrationQuery,
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
    const like = parseLike(record);
    const subjectUri = new AtUri(like.subjectUri);
    const window = {
      ctx,
      origin,
      did: record.uri.did,
      createdAt: like.createdAt,
    };
    const isLikerMember = await this.registrationQuery.isRegistered(
      ctx,
      like.accountDid,
    );
    const isAuthorMember = await this.registrationQuery.isRegistered(
      ctx,
      subjectUri.host,
    );
    if (!isLikerMember && !isAuthorMember) {
      return;
    }
    const accepted = await this.pastRecordFilterService.accepts(window);
    if (!accepted) {
      return;
    }

    await this.recordSaveService.save({ ctx, record, origin });
    await this.likeRepository.save({ ctx, like });

    await this.notificationService.notify({
      ctx,
      origin,
      notifications: () => [
        {
          recordUri: like.uri,
          recipientDid: subjectUri.host,
          authorDid: like.accountDid,
          reason: "like",
          reasonSubject: like.subjectUri,
          sortAt: getSortAt(like),
        },
      ],
    });
    const fetchesSubject =
      isLikerMember &&
      subjectUri.collection === "app.bsky.feed.post" &&
      (await this.pastRecordFilterService.isWithinWindow(window));
    if (fetchesSubject) {
      await this.relatedRecordService.request({ ctx, origin, uri: subjectUri });
    }
    this.statsService.recount({ ctx, posts: [subjectUri] });
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = parseLike(record);
    this.statsService.recount({ ctx, posts: [new AtUri(like.subjectUri)] });
  }
}

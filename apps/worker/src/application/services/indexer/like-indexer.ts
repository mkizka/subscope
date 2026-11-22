import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import { type Like, parseLike } from "../../dto/like.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { ITrackingRepository } from "../../interfaces/repositories/tracking-repository.js";
import type {
  ICollectionIndexer,
  Indexing,
} from "../../interfaces/services/index-collection-service.js";
import type { NotificationService } from "../notification-service.js";

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly notificationService: NotificationService,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: AfterCommitContext;
    record: Record;
  }) {
    const like = parseLike(record);
    return (
      (await this.registrationQuery.isRegistered(ctx, like.accountDid)) ||
      (await this.registrationQuery.isRegistered(
        ctx,
        new AtUri(like.subjectUri).host,
      ))
    );
  }

  async upsert({
    ctx,
    record,
    indexing,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    indexing: Indexing;
  }) {
    const like = parseLike(record);
    const recipientDid = new AtUri(like.subjectUri).host;
    const isRecipientServerMember = await this.registrationQuery.isRegistered(
      ctx,
      recipientDid,
    );
    await this.likeRepository.save({ ctx, like });

    if (
      indexing.live &&
      indexing.depth === 0 &&
      recipientDid !== like.accountDid &&
      isRecipientServerMember
    ) {
      await this.notificationService.create({
        ctx,
        notifications: [
          {
            recordUri: like.uri,
            recipientDid,
            authorDid: like.accountDid,
            reason: "like",
            reasonSubject: like.subjectUri,
            sortAt: getSortAt(like),
          },
        ],
      });
    }

    const subjectUri = new AtUri(like.subjectUri);
    const shouldFetch = await this.shouldFetchSubject({
      ctx,
      like,
      subjectUri,
      live: indexing.live,
    });
    if (shouldFetch) {
      await indexing.requestFetch(subjectUri);
    }
  }

  private async shouldFetchSubject({
    ctx,
    like,
    subjectUri,
    live,
  }: {
    ctx: AfterCommitContext;
    like: Like;
    subjectUri: AtUri;
    live: boolean;
  }) {
    if (subjectUri.collection !== "app.bsky.feed.post") {
      return false;
    }
    const isMember = await this.registrationQuery.isRegistered(
      ctx,
      like.accountDid,
    );
    if (!isMember) {
      return false;
    }
    if (live) {
      return true;
    }
    const tracking = await this.trackingRepository.find({
      ctx,
      did: asDid(like.accountDid),
    });
    return !!tracking && tracking.covers(like.createdAt);
  }

  afterAction({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = parseLike(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregatePostStats(new AtUri(like.subjectUri)),
    );
  }
}

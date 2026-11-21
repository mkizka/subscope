import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import { type Like, parseLike } from "../../dto/like.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IAccountQuery } from "../../interfaces/queries/account-query.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { NotificationService } from "../notification-service.js";

const SUBJECT_FETCH_WINDOW_MS = 24 * 60 * 60 * 1000;

export class LikeIndexer implements ICollectionIndexer {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly notificationService: NotificationService,
    private readonly postQuery: IPostQuery,
    private readonly accountQuery: IAccountQuery,
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
    live,
    depth,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
    depth: number;
  }) {
    const like = parseLike(record);
    const recipientDid = new AtUri(like.subjectUri).host;
    const isRecipientServerMember = await this.registrationQuery.isRegistered(
      ctx,
      recipientDid,
    );
    await this.likeRepository.save({ ctx, like });

    if (
      live &&
      depth === 0 &&
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
    if (
      subjectUri.collection === "app.bsky.feed.post" &&
      (await this.registrationQuery.isRegistered(ctx, like.accountDid)) &&
      !(await this.postQuery.exists(ctx, subjectUri)) &&
      (live || (await this.isCreatedAfterTracking(ctx, like)))
    ) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleFetchRecord(subjectUri, { live, depth }),
      );
    }
  }

  private async isCreatedAfterTracking(ctx: AfterCommitContext, like: Like) {
    const trackedAt = await this.accountQuery.findTrackedAt({
      ctx,
      did: asDid(like.accountDid),
    });
    return (
      trackedAt !== null &&
      like.createdAt.getTime() >= trackedAt.getTime() - SUBJECT_FETCH_WINDOW_MS
    );
  }

  afterAction({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const like = parseLike(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregatePostStats(new AtUri(like.subjectUri)),
    );
  }
}

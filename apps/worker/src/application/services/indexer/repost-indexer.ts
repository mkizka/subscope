import { AtUri } from "@atproto/syntax";
import type {
  AfterCommitContext,
  IJobScheduler,
  Record,
} from "@repo/common/domain";

import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import {
  feedItemFromRepost,
  parseRepost,
  sortAt,
} from "../../record-parsers.js";

export class RepostIndexer implements ICollectionIndexer {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postQuery: IPostQuery,
    private readonly jobScheduler: IJobScheduler,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly notificationRepository: INotificationRepository,
  ) {}

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
    const repost = parseRepost(record);
    await this.repostRepository.save({ ctx, repost });

    const feedItem = feedItemFromRepost(repost);
    await this.feedItemRepository.save({ ctx, feedItem });

    const subjectUri = new AtUri(repost.subjectUri);
    const recipientDid = subjectUri.host;
    if (
      recipientDid !== repost.accountDid &&
      (await this.registrationQuery.isRegistered(ctx, recipientDid))
    ) {
      await this.notificationRepository.save({
        ctx,
        notifications: [
          {
            recordUri: repost.uri,
            recipientDid,
            authorDid: repost.accountDid,
            reason: "repost",
            reasonSubject: repost.subjectUri,
            sortAt: sortAt(repost),
          },
        ],
      });
    }

    const subjectExists = await this.postQuery.exists(ctx, subjectUri);
    if (!subjectExists) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleFetchRecord(subjectUri, {
          live,
          depth,
        }),
      );
    }
  }

  afterAction({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const repost = parseRepost(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregatePostStats(
        new AtUri(repost.subjectUri),
      ),
    );
  }
}

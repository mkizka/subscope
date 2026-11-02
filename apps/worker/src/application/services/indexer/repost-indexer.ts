import type {
  AfterCommitContext,
  IJobScheduler,
  Record,
} from "@repo/common/domain";
import { FeedItem, Repost } from "@repo/common/domain";

import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { ISubscriptionQuery } from "../../interfaces/queries/subscription-query.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { INotificationRepository } from "../../interfaces/repositories/notification-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class RepostIndexer implements ICollectionIndexer {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postQuery: IPostQuery,
    private readonly jobScheduler: IJobScheduler,
    private readonly subscriptionQuery: ISubscriptionQuery,
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
    const repost = Repost.from(record);
    await this.repostRepository.save({ ctx, repost });

    const feedItem = FeedItem.fromRepost(repost);
    await this.feedItemRepository.save({ ctx, feedItem });

    const recipientDid = repost.subjectUri.host;
    if (
      recipientDid !== repost.actorDid &&
      (await this.subscriptionQuery.isSubscriber(ctx, recipientDid))
    ) {
      await this.notificationRepository.save({
        ctx,
        notifications: [
          {
            recordUri: repost.uri.toString(),
            recipientDid,
            authorDid: repost.actorDid,
            reason: "repost",
            reasonSubject: repost.subjectUri.toString(),
            sortAt: repost.sortAt,
          },
        ],
      });
    }

    const subjectExists = await this.postQuery.exists(ctx, repost.subjectUri);
    if (!subjectExists) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleFetchRecord(repost.subjectUri, {
          live,
          depth,
        }),
      );
    }
  }

  afterAction({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const repost = Repost.from(record);
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregatePostStats(repost.subjectUri),
    );
  }
}

import type {
  AfterCommitContext,
  IJobScheduler,
  Record,
  TransactionContext,
} from "@repo/common/domain";
import {
  FeedItem,
  Post,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
} from "@repo/common/domain";

import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { ISubscriptionQuery } from "../../interfaces/queries/subscription-query.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type {
  INotificationRepository,
  Notification,
} from "../../interfaces/repositories/notification-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

const REPLY_NOTIFICATION_DEPTH = 4;

export class PostIndexer implements ICollectionIndexer {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postQuery: IPostQuery,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly subscriptionQuery: ISubscriptionQuery,
    private readonly notificationRepository: INotificationRepository,
    private readonly jobScheduler: IJobScheduler,
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
    const post = Post.from(record);
    await this.postRepository.save({ ctx, post });

    const feedItem = FeedItem.fromPost(post);
    await this.feedItemRepository.save({ ctx, feedItem });

    await this.createNotifications(ctx, record, post);

    const embedUri = post.getEmbedRecordUri();
    if (embedUri) {
      const embedExists = await this.postQuery.exists(ctx, embedUri);
      if (!embedExists) {
        ctx.afterCommit(() =>
          this.jobScheduler.scheduleFetchRecord(embedUri, { live, depth }),
        );
      }
    }
  }

  private async createNotifications(
    ctx: TransactionContext,
    record: Record,
    post: Post,
  ) {
    const quoteUri = post.getEmbedRecordUri();
    const mentionDids = (record.validate("app.bsky.feed.post").facets ?? [])
      .flatMap((facet) => facet.features)
      .flatMap((feature) => ("did" in feature ? [feature.did] : []));
    const replySubjects = [];
    for (
      let uri = post.replyParent?.uri ?? null;
      uri && replySubjects.length < REPLY_NOTIFICATION_DEPTH;
      uri = await this.postQuery.findReplyParentUri(ctx, uri)
    ) {
      replySubjects.push(uri);
    }
    const candidates = [
      ...mentionDids.map((did) => ({
        recipientDid: did,
        reason: "mention" as const,
        reasonSubject: null,
      })),
      quoteUri?.collection === "app.bsky.feed.post" && {
        recipientDid: quoteUri.hostname,
        reason: "quote" as const,
        reasonSubject: quoteUri.toString(),
      },
      ...replySubjects.map((uri) => ({
        recipientDid: uri.hostname,
        reason: "reply" as const,
        reasonSubject: uri.toString(),
      })),
    ];

    const notifications = new Map<string, Notification>();
    for (const candidate of candidates) {
      if (
        !candidate ||
        candidate.recipientDid === post.actorDid ||
        notifications.has(candidate.recipientDid) ||
        !(await this.subscriptionQuery.isSubscriber(
          ctx,
          candidate.recipientDid,
        ))
      ) {
        continue;
      }
      notifications.set(candidate.recipientDid, {
        ...candidate,
        recordUri: post.uri.toString(),
        authorDid: post.actorDid,
        sortAt: post.sortAt,
      });
    }
    await this.notificationRepository.save({
      ctx,
      notifications: [...notifications.values()],
    });
  }

  afterAction({
    ctx,
    record,
    action,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    action: "upsert" | "delete";
  }): Promise<void> {
    const post = Post.from(record);

    ctx.afterCommit(() =>
      this.jobScheduler.scheduleAggregateActorStats(post.actorDid, "posts"),
    );

    // 削除時にafterActionが呼ばれる場合は投稿が存在しないのでupsertに限定
    if (action === "upsert") {
      // 投稿をインデックスする時点でいいね/リポストが存在する可能性があるので集計する
      // 例：リポストをインデックス → fetchRecordジョブでリポスト対象をインデックス
      //    → このとき、リポスト数が0なので1にする必要がある
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleAggregatePostStats(post.uri),
      );
    }

    const replyParent = post.replyParent;
    if (replyParent) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleAggregatePostStats(replyParent.uri),
      );
    }

    if (
      post.embed instanceof PostEmbedRecord ||
      post.embed instanceof PostEmbedRecordWithMedia
    ) {
      const embedUri = post.embed.uri;
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleAggregatePostStats(embedUri),
      );
    }

    return Promise.resolve();
  }
}

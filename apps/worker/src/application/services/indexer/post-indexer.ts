import type { Record, TransactionContext } from "@repo/common/domain";
import {
  FeedItem,
  Post,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
} from "@repo/common/domain";

import type { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { AggregateStatsScheduler } from "../scheduler/aggregate-stats-scheduler.js";
import type { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";

export class PostIndexer implements ICollectionIndexer {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postIndexingPolicy: PostIndexingPolicy,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly fetchRecordScheduler: FetchRecordScheduler,
    private readonly aggregateStatsScheduler: AggregateStatsScheduler,
  ) {}
  static inject = [
    "postRepository",
    "postIndexingPolicy",
    "feedItemRepository",
    "actorStatsRepository",
    "fetchRecordScheduler",
    "aggregateStatsScheduler",
  ] as const;

  async upsert({
    ctx,
    record,
    depth,
  }: {
    ctx: TransactionContext;
    record: Record;
    depth: number;
  }) {
    const post = Post.from(record);
    await this.postRepository.upsert({ ctx, post });

    const feedItem = FeedItem.fromPost(post);
    await this.feedItemRepository.upsert({ ctx, feedItem });

    const embedUri = post.getEmbedRecordUri();
    if (embedUri) {
      const embedExists = await this.postRepository.exists(ctx, embedUri);
      if (!embedExists) {
        await this.fetchRecordScheduler.schedule(embedUri, depth);
      }
    }
  }

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const post = Post.from(record);
    return await this.postIndexingPolicy.shouldIndex(ctx, post);
  }

  async afterAction({
    ctx,
    record,
    action,
  }: {
    ctx: TransactionContext;
    record: Record;
    action: "upsert" | "delete";
  }): Promise<void> {
    const post = Post.from(record);

    await this.actorStatsRepository.upsertPostsCount({
      ctx,
      actorDid: post.actorDid,
    });

    // 削除時にafterActionが呼ばれる場合は投稿が存在しないのでupsertに限定
    if (action === "upsert") {
      // 投稿をインデックスする時点でいいね/リポストが存在する可能性があるので集計する
      // 例：リポストをインデックス → fetchRecordジョブでリポスト対象をインデックス
      //    → このとき、リポスト数が0なので1にする必要がある
      await this.aggregateStatsScheduler.schedule(post.uri, "all");
    }

    if (post.replyParent) {
      await this.aggregateStatsScheduler.schedule(
        post.replyParent.uri,
        "reply",
      );
    }

    if (
      post.embed instanceof PostEmbedRecord ||
      post.embed instanceof PostEmbedRecordWithMedia
    ) {
      await this.aggregateStatsScheduler.schedule(post.embed.uri, "quote");
    }
  }
}

import type { Record, TransactionContext } from "@repo/common/domain";
import { FeedItem, Post, PostEmbedRecord } from "@repo/common/domain";

import type { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";

export class PostIndexer implements ICollectionIndexer {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postIndexingPolicy: PostIndexingPolicy,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly fetchRecordScheduler: FetchRecordScheduler,
  ) {}
  static inject = [
    "postRepository",
    "postIndexingPolicy",
    "postStatsRepository",
    "feedItemRepository",
    "actorStatsRepository",
    "fetchRecordScheduler",
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
    await this.feedItemRepository.upsertPost({ ctx, feedItem });

    const embedUri = post.getFetchableEmbedUri();
    if (embedUri) {
      await this.fetchRecordScheduler.schedule(embedUri, depth);
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

  async updateStats({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<void> {
    const post = Post.from(record);

    await this.actorStatsRepository.upsertPostsCount({
      ctx,
      actorDid: post.actorDid,
    });

    // 投稿をインデックスする時点でいいね/リポストが存在する可能性があるので集計する
    // 例：リポストをインデックス → fetchRecordジョブでリポスト対象をインデックス
    //    → このとき、リポスト数が0なので1にする必要がある
    await this.postStatsRepository.upsertAllCount({
      ctx,
      uri: post.uri,
    });

    if (post.replyParent) {
      const parentExists = await this.postRepository.exists(
        ctx,
        post.replyParent.uri.toString(),
      );
      if (parentExists) {
        await this.postStatsRepository.upsertReplyCount({
          ctx,
          uri: post.replyParent.uri,
        });
      }
    }

    if (post.embed instanceof PostEmbedRecord) {
      const quotedPostExists = await this.postRepository.exists(
        ctx,
        post.embed.uri.toString(),
      );
      if (quotedPostExists) {
        await this.postStatsRepository.upsertQuoteCount({
          ctx,
          uri: post.embed.uri,
        });
      }
    }
  }
}

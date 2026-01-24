import type { Record, TransactionContext } from "@repo/common/domain";
import {
  FeedItem,
  Post,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
} from "@repo/common/domain";
import type { IJobScheduler } from "@repo/common/infrastructure";

import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { AggregateActorStatsScheduler } from "../scheduler/aggregate-actor-stats-scheduler.js";
import type { AggregatePostStatsScheduler } from "../scheduler/aggregate-post-stats-scheduler.js";

export class PostIndexer implements ICollectionIndexer {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly aggregatePostStatsScheduler: AggregatePostStatsScheduler,
    private readonly aggregateActorStatsScheduler: AggregateActorStatsScheduler,
  ) {}
  static inject = [
    "postRepository",
    "feedItemRepository",
    "jobScheduler",
    "aggregatePostStatsScheduler",
    "aggregateActorStatsScheduler",
  ] as const;

  async upsert({
    ctx,
    record,
    live,
    depth,
  }: {
    ctx: TransactionContext;
    record: Record;
    live: boolean;
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
        await this.jobScheduler.scheduleFetchRecord(embedUri, { live, depth });
      }
    }
  }

  async afterAction({
    record,
    action,
  }: {
    ctx: TransactionContext;
    record: Record;
    action: "upsert" | "delete";
  }): Promise<void> {
    const post = Post.from(record);

    await this.aggregateActorStatsScheduler.schedule(post.actorDid, "posts");

    // 削除時にafterActionが呼ばれる場合は投稿が存在しないのでupsertに限定
    if (action === "upsert") {
      // 投稿をインデックスする時点でいいね/リポストが存在する可能性があるので集計する
      // 例：リポストをインデックス → fetchRecordジョブでリポスト対象をインデックス
      //    → このとき、リポスト数が0なので1にする必要がある
      await this.aggregatePostStatsScheduler.schedule(post.uri, "all");
    }

    if (post.replyParent) {
      await this.aggregatePostStatsScheduler.schedule(
        post.replyParent.uri,
        "reply",
      );
    }

    if (
      post.embed instanceof PostEmbedRecord ||
      post.embed instanceof PostEmbedRecordWithMedia
    ) {
      await this.aggregatePostStatsScheduler.schedule(post.embed.uri, "quote");
    }
  }
}

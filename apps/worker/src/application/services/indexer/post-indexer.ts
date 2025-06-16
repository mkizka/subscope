import type { Record, TransactionContext } from "@repo/common/domain";
import { Post } from "@repo/common/domain";

import type { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class PostIndexer implements ICollectionIndexer {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postIndexingPolicy: PostIndexingPolicy,
    private readonly postStatsRepository: IPostStatsRepository,
  ) {}
  static inject = [
    "postRepository",
    "postIndexingPolicy",
    "postStatsRepository",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const post = Post.from(record);
    await this.postRepository.upsert({ ctx, post });
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

    if (post.replyParent) {
      await this.postStatsRepository.upsertReplyCount({
        ctx,
        postUri: post.replyParent.uri.toString(),
      });
    }
  }
}

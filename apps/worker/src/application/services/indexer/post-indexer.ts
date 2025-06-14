import type { Record, TransactionContext } from "@repo/common/domain";
import { Post } from "@repo/common/domain";

import type { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";

export class PostIndexer implements IIndexCollectionService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postIndexingPolicy: PostIndexingPolicy,
  ) {}
  static inject = ["postRepository", "postIndexingPolicy"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const post = Post.from(record);
    await this.postRepository.upsert({ ctx, post });
  }

  async shouldSave({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const post = Post.from(record);
    return await this.postIndexingPolicy.shouldIndex(ctx, post);
  }
}

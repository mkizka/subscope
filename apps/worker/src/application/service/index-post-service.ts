import type { Record, TransactionContext } from "@dawn/common/domain";
import { Post } from "@dawn/common/domain";

import type { IIndexColectionService } from "../interfaces/index-collection-service.js";
import type { IPostRepository } from "../interfaces/post-repository.js";

export class IndexPostService implements IIndexColectionService {
  constructor(private readonly postRepository: IPostRepository) {}
  static inject = ["postRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const post = Post.from(record);
    await this.postRepository.upsert({ ctx, post });
  }
}

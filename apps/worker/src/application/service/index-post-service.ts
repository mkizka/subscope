import type { Record, TransactionContext } from "@dawn/common/domain";
import { Post } from "@dawn/common/domain";

import type { IPostRepository } from "../interfaces/post-repository.js";

export class IndexPostService {
  constructor(private readonly postRepository: IPostRepository) {}
  static inject = ["postRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const post = Post.from(record);
    await this.postRepository.upsert({ ctx, post });
  }
}

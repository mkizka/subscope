import type { Post, TransactionContext } from "@dawn/common/domain";

export interface IPostRepository {
  createOrUpdate: (params: {
    ctx: TransactionContext;
    post: Post;
  }) => Promise<void>;
}

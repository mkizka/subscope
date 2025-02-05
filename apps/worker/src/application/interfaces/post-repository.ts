import type { Post, TransactionContext } from "@dawn/common/domain";

export interface IPostRepository {
  upsert: (params: { ctx: TransactionContext; post: Post }) => Promise<void>;
}

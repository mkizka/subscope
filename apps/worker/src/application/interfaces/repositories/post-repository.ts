import type { Post, TransactionContext } from "@repo/common/domain";

export interface IPostRepository {
  save: (params: { ctx: TransactionContext; post: Post }) => Promise<void>;
}

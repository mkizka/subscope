import type { TransactionContext } from "@repo/common/interface";

import type { Post } from "../../../domain/post.js";

export interface IPostRepository {
  save: (params: { ctx: TransactionContext; post: Post }) => Promise<void>;
}

import type { TransactionContext } from "@repo/common/domain";

import type { Post } from "../../models/post.js";

export interface IPostRepository {
  save: (params: { ctx: TransactionContext; post: Post }) => Promise<void>;
}

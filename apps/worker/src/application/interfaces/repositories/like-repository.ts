import type { TransactionContext } from "@repo/common/domain";

import type { Like } from "../../models/like.js";

export interface ILikeRepository {
  save: (params: { ctx: TransactionContext; like: Like }) => Promise<void>;
}

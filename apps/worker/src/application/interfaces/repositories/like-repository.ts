import type { TransactionContext } from "@repo/common/interface";

import type { Like } from "../../../domain/like.js";

export interface ILikeRepository {
  save: (params: { ctx: TransactionContext; like: Like }) => Promise<void>;
}

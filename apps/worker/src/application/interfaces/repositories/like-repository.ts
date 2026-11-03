import type { TransactionContext } from "@repo/common/domain";

import type { LikeRow } from "../../record-parsers.js";

export interface ILikeRepository {
  save: (params: { ctx: TransactionContext; like: LikeRow }) => Promise<void>;
}

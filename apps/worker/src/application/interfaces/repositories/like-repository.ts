import type { Like, TransactionContext } from "@repo/common/domain";

export interface ILikeRepository {
  upsert: (params: { ctx: TransactionContext; like: Like }) => Promise<void>;
}

import type { Like, TransactionContext } from "@repo/common/domain";

export interface ILikeRepository {
  save: (params: { ctx: TransactionContext; like: Like }) => Promise<void>;
}

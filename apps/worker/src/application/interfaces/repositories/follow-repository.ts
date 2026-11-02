import type { Follow, TransactionContext } from "@repo/common/domain";

export interface IFollowRepository {
  save: (params: { ctx: TransactionContext; follow: Follow }) => Promise<void>;
}

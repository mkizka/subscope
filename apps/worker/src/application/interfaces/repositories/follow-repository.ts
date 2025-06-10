import type { Follow, TransactionContext } from "@repo/common/domain";

export interface IFollowRepository {
  upsert: (params: {
    ctx: TransactionContext;
    follow: Follow;
  }) => Promise<void>;
}
